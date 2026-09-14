import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import {
  PDFField,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFButton,
  PDFSignature,
} from "pdf-lib";

function getFieldType(
  field: PDFField,
):
  | "text"
  | "checkbox"
  | "radio"
  | "dropdown"
  | "optionlist"
  | "button"
  | "signature"
  | "unknown" {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFDropdown) return "dropdown";
  if (field instanceof PDFOptionList) return "optionlist";
  if (field instanceof PDFButton) return "button";
  if (field instanceof PDFSignature) return "signature";
  return "unknown";
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

/** Confirms the caller paid the form fee for this form before we hand over bytes. */
async function assertPaidFor(
  formId: string,
  sessionId?: string,
): Promise<string | null> {
  if (!sessionId) return "Missing payment session";
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return "Payment not completed";
    if (session.metadata?.formId !== formId)
      return "Payment is for a different form";
    if ((session.metadata?.purpose ?? "form-access") !== "form-access") {
      return "Payment is not a form purchase";
    }
    /* No DB, so the download counter lives on the PaymentIntent's metadata.
       Generous limit: reprints and retries are legitimate, resale is not. */
    const MAX_FILLS = 5;
    const intentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (intentId) {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      const fills = parseInt(intent.metadata?.fills ?? "0", 10) || 0;
      if (fills >= MAX_FILLS) {
        return "This form has already been downloaded the maximum number of times";
      }
      await stripe.paymentIntents.update(intentId, {
        metadata: { ...intent.metadata, fills: String(fills + 1) },
      });
    }

    return null;
  } catch (error) {
    console.error("Stripe session lookup failed:", error);
    return "Could not verify payment";
  }
}

// Helper function to convert ISO date (YYYY-MM-DD) to dd/mm/yyyy format
function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get form data
    const formData = await request.json();
    console.log("Received form data:", formData);

    const paymentError = await assertPaidFor("n4", formData.paidSessionId);
    if (paymentError) {
      console.warn(`Blocked unpaid N4 fill: ${paymentError}`);
      return NextResponse.json({ error: paymentError }, { status: 402 });
    }
    // Load the N4 PDF
    const pdfPath = path.join(
      process.cwd(),
      "public",
      "templates",
      "N4_Acro.pdf",
    );
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    let filledCount = 0;

    fields.forEach((field) => {
      const fieldName = field.getName();
      // const fieldType = field.constructor.name;
      const fieldType = getFieldType(field);
      console.log(`📝 Field: ${fieldName} | Type: ${fieldType}`);

      if (fieldType === "text") {
        console.log("Processing PDFTextField...");

        try {
          // Use exact matching instead of includes to avoid false positives
          if (
            fieldName.includes(
              "form1[0].#subform[1].Notice_Name_and_Address[0].TO_TenameName[0]",
            )
          ) {
            console.log("✅ Filling TENANT NAME field");
            // Handle tenantNames as either array or comma-separated string
            const tenantNames = Array.isArray(formData.tenantNames)
              ? formData.tenantNames.join(", ")
              : formData.tenantNames || "";
            (field as any).setText(tenantNames);
          } else if (
            fieldName ==
            "form1[0].#subform[1].Notice_Name_and_Address[0].From_LandlordName[0]"
          ) {
            console.log("✅ Filling LANDLORD NAME field");
            (field as any).setText(formData.landlordName || "");
          } else if (
            fieldName ==
            "form1[0].#subform[1].Notice_Name_and_Address[0].RentalUnitAddress[0]"
          ) {
            console.log("✅ Filling RENTAL ADDRESS field");
            (field as any).setText(formData.rentalAddress || "");
          } else if (fieldName == "form1[0].#subform[1].PayDate[0]") {
            console.log("✅ Filling TERMINATION DATE field");
            (field as any).setText(formData.terminationDate || "");
          }

          // Rental Period 1 fields - Using form data
          else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].ArrearFrom1[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 1 FROM DATE");
            if (formData.rentalPeriods?.[0]?.fromDate) {
              (field as any).setText(formData.rentalPeriods[0].fromDate || "");
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].ArrearTo1[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 1 TO DATE");
            if (formData.rentalPeriods?.[0]?.toDate) {
              (field as any).setText(formData.rentalPeriods[0].toDate);
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentCharge1[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 1 RENT CHARGE");
            try {
              if (formData.rentalPeriods?.[0]?.lawfulRent) {
                const amount =
                  parseFloat(formData.rentalPeriods[0].lawfulRent) || 0;
                (field as any).setText(amount.toFixed(2).padStart(9, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 1 RENT CHARGE: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 1 RENT CHARGE': ${error}`,
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentPaid1[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 1 RENT PAID");
            try {
              if (formData.rentalPeriods?.[0]?.paidRent) {
                const amount =
                  parseFloat(formData.rentalPeriods[0].paidRent) || 0;
                (field as any).setText(amount.toFixed(2).padStart(9, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 1 RENT PAID: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 1 RENT PAID': ${error}`,
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentOwe1[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 1 RENT OWING");
            try {
              if (
                formData.rentalPeriods?.[0]?.lawfulRent &&
                formData.rentalPeriods?.[0]?.paidRent
              ) {
                const lawfulRent =
                  parseFloat(formData.rentalPeriods[0].lawfulRent) || 0;
                const paidRent =
                  parseFloat(formData.rentalPeriods[0].paidRent) || 0;
                const owing = (lawfulRent - paidRent).toFixed(2);
                (field as any).setText(owing.padStart(10, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 1 RENT OWING: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 1 RENT OWING': ${error}`,
              );
            }
          }

          // Rental Period 2 fields - Using form data
          else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].ArrearFrom2[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 2 FROM DATE");
            if (formData.rentalPeriods?.[1]?.fromDate) {
              (field as any).setText(formData.rentalPeriods[1].fromDate);
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].ArrearTo2[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 2 TO DATE");
            if (formData.rentalPeriods?.[1]?.toDate) {
              (field as any).setText(formData.rentalPeriods[1].toDate);
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentCharge2[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 2 RENT CHARGE");
            try {
              if (formData.rentalPeriods?.[1]?.lawfulRent) {
                const amount =
                  parseFloat(formData.rentalPeriods[1].lawfulRent) || 0;
                (field as any).setText(amount.toFixed(2).padStart(9, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 2 RENT CHARGE: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 2 RENT CHARGE': ${error}`,
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentPaid2[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 2 RENT PAID");
            try {
              if (formData.rentalPeriods?.[1]?.paidRent) {
                const amount =
                  parseFloat(formData.rentalPeriods[1].paidRent) || 0;
                (field as any).setText(amount.toFixed(2).padStart(9, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 2 RENT PAID: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 2 RENT PAID': ${error}`,
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentOwe2[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 2 RENT OWING");
            try {
              if (
                formData.rentalPeriods?.[1]?.lawfulRent &&
                formData.rentalPeriods?.[1]?.paidRent
              ) {
                const lawfulRent =
                  parseFloat(formData.rentalPeriods[1].lawfulRent) || 0;
                const paidRent =
                  parseFloat(formData.rentalPeriods[1].paidRent) || 0;
                const owing = (lawfulRent - paidRent).toFixed(2);
                (field as any).setText(owing.padStart(10, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 2 RENT OWING: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 2 RENT OWING': ${error}`,
              );
            }
          }

          // Rental Period 3 fields - Using form data (aggregated for periods 3+)
          else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].ArrearFrom3[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 3 FROM DATE");
            if (formData.rentalPeriods?.[2]?.fromDate) {
              (field as any).setText(formData.rentalPeriods[2].fromDate);
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].ArrearTo3[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 3 TO DATE");
            // Use the end date of the last rental period if there are more than 3 periods
            if (formData.rentalPeriods && formData.rentalPeriods.length > 2) {
              const lastPeriodIndex = formData.rentalPeriods.length - 1;
              if (formData.rentalPeriods[lastPeriodIndex]?.toDate) {
                (field as any).setText(
                  formData.rentalPeriods[lastPeriodIndex].toDate,
                );
              }
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentCharge3[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 3 RENT CHARGE");
            try {
              // Sum all lawful rent from period 3 onwards
              if (formData.rentalPeriods && formData.rentalPeriods.length > 2) {
                let totalLawfulRent = 0;
                for (let i = 2; i < formData.rentalPeriods.length; i++) {
                  if (formData.rentalPeriods[i]?.lawfulRent) {
                    totalLawfulRent +=
                      parseFloat(formData.rentalPeriods[i].lawfulRent) || 0;
                  }
                }
                if (totalLawfulRent > 0) {
                  const amount = totalLawfulRent.toFixed(2);
                  (field as any).setText(amount.padStart(9, " "));
                }
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 3 RENT CHARGE: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 3 RENT CHARGE': ${error}`,
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentPaid3[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 3 RENT PAID");
            try {
              // Sum all paid rent from period 3 onwards
              if (formData.rentalPeriods && formData.rentalPeriods.length > 2) {
                let totalPaidRent = 0;
                for (let i = 2; i < formData.rentalPeriods.length; i++) {
                  if (formData.rentalPeriods[i]?.paidRent) {
                    totalPaidRent +=
                      parseFloat(formData.rentalPeriods[i].paidRent) || 0;
                  }
                }
                const amount = totalPaidRent.toFixed(2);
                (field as any).setText(amount.padStart(9, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 3 RENT PAID: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 3 RENT PAID': ${error}`,
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentOwe3[0]"
          ) {
            console.log("✅ Filling RENTAL PERIOD 3 RENT OWING");
            try {
              // Calculate total owing from period 3 onwards
              if (formData.rentalPeriods && formData.rentalPeriods.length > 2) {
                let totalLawfulRent = 0;
                let totalPaidRent = 0;
                for (let i = 2; i < formData.rentalPeriods.length; i++) {
                  if (formData.rentalPeriods[i]?.lawfulRent) {
                    totalLawfulRent +=
                      parseFloat(formData.rentalPeriods[i].lawfulRent) || 0;
                  }
                  if (formData.rentalPeriods[i]?.paidRent) {
                    totalPaidRent +=
                      parseFloat(formData.rentalPeriods[i].paidRent) || 0;
                  }
                }
                const owing = (totalLawfulRent - totalPaidRent).toFixed(2);
                (field as any).setText(owing.padStart(10, " "));
              }
            } catch (error) {
              console.error(
                `❌ Error filling RENTAL PERIOD 3 RENT OWING: ${error}`,
              );
              throw new Error(
                `Failed to fill field 'RENTAL PERIOD 3 RENT OWING': ${error}`,
              );
            }
          }

          // Total Rent Owing - Using form data
          else if (
            fieldName ==
            "form1[0].#subform[4].LTHAS_Arrear_L1[0].TotalRentOwe[0]"
          ) {
            console.log("✅ Filling TOTAL RENT OWING");
            try {
              // Calculate total owing from all periods
              if (formData.rentalPeriods && formData.rentalPeriods.length > 0) {
                let totalLawfulRent = 0;
                let totalPaidRent = 0;
                for (let i = 0; i < formData.rentalPeriods.length; i++) {
                  if (formData.rentalPeriods[i]?.lawfulRent) {
                    totalLawfulRent +=
                      parseFloat(formData.rentalPeriods[i].lawfulRent) || 0;
                  }
                  if (formData.rentalPeriods[i]?.paidRent) {
                    totalPaidRent +=
                      parseFloat(formData.rentalPeriods[i].paidRent) || 0;
                  }
                }
                const totalOwing = (totalLawfulRent - totalPaidRent).toFixed(2);
                (field as any).setText(totalOwing.padStart(11, " "));
              }
            } catch (error) {
              console.error(`❌ Error filling TOTAL RENT OWING: ${error}`);
              throw new Error(
                `Failed to fill field 'TOTAL RENT OWING': ${error}`,
              );
            }
          }

          // Main Amount Owed - Using form data
          else if (fieldName == "form1[0].#subform[1].OweMeAmount[0]") {
            console.log("✅ Filling MAIN AMOUNT OWED");
            try {
              // Calculate total owing from all periods
              if (formData.rentalPeriods && formData.rentalPeriods.length > 0) {
                let totalLawfulRent = 0;
                let totalPaidRent = 0;
                for (let i = 0; i < formData.rentalPeriods.length; i++) {
                  if (formData.rentalPeriods[i]?.lawfulRent) {
                    totalLawfulRent +=
                      parseFloat(formData.rentalPeriods[i].lawfulRent) || 0;
                  }
                  if (formData.rentalPeriods[i]?.paidRent) {
                    totalPaidRent +=
                      parseFloat(formData.rentalPeriods[i].paidRent) || 0;
                  }
                }
                const totalOwing = (totalLawfulRent - totalPaidRent).toFixed(2);
                (field as any).setText(totalOwing.padStart(10, " "));
              }
            } catch (error) {
              console.error(`❌ Error filling MAIN AMOUNT OWED: ${error}`);
              throw new Error(
                `Failed to fill field 'MAIN AMOUNT OWED': ${error}`,
              );
            }
          }

          // Signature fields
          else if (
            fieldName ==
            "form1[0].#subform[4].Signature_for_Notice[0].RFirstName[0]"
          ) {
            if (formData.whoAreYou === "landlord") {
              console.log("✅ Filling FIRST NAME SIGNATURE LANDLORD");
              (field as any).setText(
                formData.landlordName?.split(" ")[0] || "",
              );
            } else {
              formData.landlordName[0];
              console.log("✅ Filling FIRST NAME SIGNATURE REPRESENTATIVE");
              (field as any).setText(
                formData.representativeName?.split(" ")[0] || "",
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].Signature_for_Notice[0].RLastName[0]"
          ) {
            if (formData.whoAreYou === "landlord") {
              console.log("✅ Filling LAST NAME SIGNATURE LANDLORD");
              (field as any).setText(
                formData.landlordName?.split(" ").slice(1).join(" ") || "",
              );
            } else {
              formData.landlordName[0];
              console.log("✅ Filling LAST NAME SIGNATURE REPRESENTATIVE");
              (field as any).setText(
                formData.representativeName?.split(" ").slice(1).join(" ") ||
                  "",
              );
            }
          } else if (
            fieldName ==
            "form1[0].#subform[4].Signature_for_Notice[0].RDayPhone[0]"
          ) {
            if (formData.whoAreYou === "landlord") {
              console.log("✅ Filling LANDLORD PHONE NUMBER SIGNATURE");
              (field as any).setText(formData.landlordPhoneNumber || "");
            } else {
              console.log("✅ Filling REPRESENTATIVE PHONE NUMBER SIGNATURE");
              (field as any).setText(formData.representativePhoneNumber || "");
            }
          } else if (
            fieldName ==
            "form1[0].#subform[3].Signature_for_Notice_N4[0].Signature[0]"
          ) {
            console.log("✅ Filling SIGNATURE");
            (field as any).setText(formData.representativeName || "Signature");
          } else if (
            fieldName ==
            "form1[0].#subform[3].Signature_for_Notice_N4[0].SignDate[0]"
          ) {
            console.log("✅ Filling SIGNATURE DATE");
            (field as any).setText(
              formData.serveDate || new Date().toLocaleDateString("en-GB"),
            );
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentName[0]"
          ) {
            console.log("✅ Filling AGENT NAME");
            (field as any).setText(formData.representativeName || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentLSUC[0]"
          ) {
            console.log("✅ Filling AGENT LSUC");
            (field as any).setText(formData.lsucNumber || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentCompany[0]"
          ) {
            console.log("✅ Filling AGENT COMPANY");
            (field as any).setText(formData.companyName || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentAddress[0]"
          ) {
            console.log("✅ Filling AGENT ADDRESS");
            (field as any).setText(formData.mailingAddress || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentPhoneNum[0]"
          ) {
            console.log("✅ Filling REPRESENTATIVE PHONE NUMBER");
            (field as any).setText(formData.representativePhoneNumber || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentMunicipality[0]"
          ) {
            console.log("✅ Filling AGENT MUNICIPALITY");
            (field as any).setText(formData.municipality || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentProvince[0]"
          ) {
            console.log("✅ Filling AGENT PROVINCE");
            (field as any).setText(formData.province || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentPostCode[0]"
          ) {
            console.log("✅ Filling AGENT POST CODE");
            (field as any).setText(formData.postalCode || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Agent_Information_for_Notice[0].AgentFaxNum[0]"
          ) {
            console.log("✅ Filling AGENT FAX NUMBER");
            (field as any).setText(formData.faxNumber || "");
          } else if (
            fieldName ==
              "form1[0].#subform[4].Signature_for_Notice[0].Signature[0]" &&
            formData.whoAreYou === "landlord"
          ) {
            console.log("✅ Filling SIGNATURE");
            console.log(
              "✅ Filling SIGNATURE LANDLORD: ",
              formData.landlordName,
              formData.landlordName[0],
            );
            const signature = `${formData.landlordName[0]} ${formData.landlordName?.split(" ").slice(1).join(" ")[0] || ""}`;
            (field as any).setText(signature || "");
          } else if (
            fieldName ==
              "form1[0].#subform[4].Signature_for_Notice[0].Signature[0]" &&
            formData.whoAreYou === "legal"
          ) {
            console.log("✅ Filling SIGNATURE");
            console.log(
              "✅ Filling SIGNATURE LEGAL REPRESENTATIVE: ",
              formData.representativeName,
              formData.representativeName[0],
            );
            const signature = `${formData.representativeName[0]} ${formData.representativeName?.split(" ").slice(1).join(" ")[0] || ""}`;
            (field as any).setText(signature || "");
          } else if (
            fieldName ==
            "form1[0].#subform[4].Signature_for_Notice[0].SignDate[0]"
          ) {
            console.log("✅ Filling SERVER DATE");
            (field as any).setText(formData.serveDate || "");
          } else {
            // Log any fields that don't match our expected field names
            console.log(`❌ UNMATCHED FIELD: ${fieldName}`);
          }

          // // Special handling for amount fields - set right alignment
          // if (fieldName.toLowerCase().includes('amount') ||
          //     fieldName.toLowerCase().includes('rent') ||
          //     fieldName.toLowerCase().includes('charge') ||
          //     fieldName.toLowerCase().includes('paid') ||
          //     fieldName.toLowerCase().includes('owe')) {
          //   try {
          //     // Try to set right alignment for amount fields
          //     if ((field as any).setAlignment) {
          //       (field as any).setAlignment('right');
          //     }
          //     if ((field as any).setTextAlignment) {
          //       (field as any).setTextAlignment('right');
          //     }
          //   } catch (e) {
          //     console.log(`Could not set alignment for amount field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
          //   }
          // }
          // (field as any).setText(fillData[fieldName].toString());

          // // Set text color to black
          // try {
          //   if ((field as any).setTextColor) {
          //     (field as any).setTextColor({ r: 0, g: 0, b: 0 }); // Black color
          //   }
          // } catch (e) {
          //   console.log(`Could not set text color for field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
          // }

          filledCount++;
        } catch (error) {
          console.error(`❌ Error processing field ${fieldName}: ${error}`);
          throw new Error(`Failed to process field '${fieldName}': ${error}`);
        }
      }

      if (fieldType === "radio") {
        // const data = {
        //   'form1[0].#subform[4].SelectSign[0]': formData.whoAreYou === 'legal' ? '2' : '1'
        // }
        // const radioValue = data[fieldName as keyof typeof data].toString();
        // try {
        //   const options = (field as any).getOptions();
        //   console.log("🔥 RADIO GROUP OPTIONS", options);
        //   if (options && options.length > 0) {
        //     const optionToSelect = options.find((opt: string) => opt.toLowerCase().includes(radioValue.toLowerCase())) || options[0];
        //     console.log("✅ Filling RADIO GROUP", optionToSelect);
        //     (field as any).select(optionToSelect);
        //   } else {
        //     (field as any).select(radioValue);
        //   }
        // } catch (e) {
        //   const commonValues = [radioValue, radioValue.toUpperCase(), radioValue.toLowerCase(), '1', '0', 'Yes', 'No'];
        //   let selected = false;
        //   for (const val of commonValues) {
        //     try {
        //       (field as any).select(val);
        //       selected = true;
        //       break;
        //     } catch { }
        //   }
        //   if (!selected) {
        //     console.log(`Could not select radio option for ${fieldName}`);
        //   }
        // }
        if (
          fieldName == "form1[0].#subform[4].SelectSign[0]" &&
          formData.whoAreYou === "legal"
        ) {
          console.log("✅ Filling SIGNATURE");
          (field as any).select("2");
        } else if (
          fieldName == "form1[0].#subform[4].SelectSign[0]" &&
          formData.whoAreYou === "landlord"
        ) {
          console.log("✅ Filling SIGNATURE");
          (field as any).select("1");
        }
        filledCount++;
      }

      //   // Use the full field name to match with form data
      // if (fillData[fieldName] !== undefined) {
      //   try {
      //     if (fieldType === 'PDFTextField') {
      //       // Special handling for amount fields - set right alignment
      //       if (fieldName.toLowerCase().includes('amount') ||
      //           fieldName.toLowerCase().includes('rent') ||
      //           fieldName.toLowerCase().includes('charge') ||
      //           fieldName.toLowerCase().includes('paid') ||
      //           fieldName.toLowerCase().includes('owe')) {
      //         try {
      //           // Try to set right alignment for amount fields
      //           if ((field as any).setAlignment) {
      //             (field as any).setAlignment('right');
      //           }
      //           if ((field as any).setTextAlignment) {
      //             (field as any).setTextAlignment('right');
      //           }
      //         } catch (e) {
      //           console.log(`Could not set alignment for amount field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      //         }
      //       }
      //       (field as any).setText(fillData[fieldName].toString());

      //       // Set text color to black
      //       try {
      //         if ((field as any).setTextColor) {
      //           (field as any).setTextColor({ r: 0, g: 0, b: 0 }); // Black color
      //         }
      //       } catch (e) {
      //         console.log(`Could not set text color for field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      //       }

      //       filledCount++;
      //     } else if (fieldType === 'PDFCheckBox') {
      //       if (fillData[fieldName] === true) {
      //         (field as any).check();
      //       } else {
      //         (field as any).uncheck();
      //       }
      //       filledCount++;
      //     } else if (fieldType === 'PDFRadioGroup') {
      //       const radioValue = fillData[fieldName].toString();
      //       try {
      //         const options = (field as any).getOptions();
      //         if (options && options.length > 0) {
      //           const optionToSelect = options.find((opt: string) => opt.toLowerCase().includes(radioValue.toLowerCase())) || options[0];
      //           (field as any).select(optionToSelect);
      //         } else {
      //           (field as any).select(radioValue);
      //         }
      //       } catch (e) {
      //         const commonValues = [radioValue, radioValue.toUpperCase(), radioValue.toLowerCase(), '1', '0', 'Yes', 'No'];
      //         let selected = false;
      //         for (const val of commonValues) {
      //           try {
      //             (field as any).select(val);
      //             selected = true;
      //             break;
      //           } catch {}
      //         }
      //         if (!selected) {
      //           console.log(`Could not select radio option for ${fieldName}`);
      //         }
      //       }
      //       filledCount++;
      //     } else if (fieldType === 'PDFDropdown') {
      //       try {
      //         (field as any).select(fillData[fieldName].toString());
      //       } catch (e) {
      //         (field as any).setText(fillData[fieldName].toString());
      //       }
      //       filledCount++;
      //     }
      //   } catch (error) {
      //     console.log(`Could not fill field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      //   }
      // } else {
      //   // Fill fields not in our predefined list with generic dummy data
      //   try {
      //     if (fieldType === 'PDFTextField') {
      //       let dummyText = 'Sample Text';
      //       if (fieldName.toLowerCase().includes('date')) {
      //         dummyText = '15/08/2024';
      //       } else if (fieldName.toLowerCase().includes('TO_Te') && fieldName.toLowerCase().includes('name')) {
      //         dummyText = 'Sarah Johnson';
      //       } else if (fieldName.toLowerCase().includes('landlord') && fieldName.toLowerCase().includes('name')) {
      //         dummyText = 'Robert Williams';
      //       } else if (fieldName.toLowerCase().includes('agent') && fieldName.toLowerCase().includes('name')) {
      //         dummyText = 'David Thompson';
      //       } else if (fieldName.toLowerCase().includes('name')) {
      //         dummyText = 'Robert Williams';
      //       } else if (fieldName.toLowerCase().includes('rental')) {
      //         dummyText = '456 Oak Avenue, Suite 201, Mississauga, ON L5B 2C3';
      //       } else if (fieldName.toLowerCase().includes('agent') && fieldName.toLowerCase().includes('address')) {
      //         dummyText = '789 Bay Street, Floor 15, Toronto, ON M5G 1M5';
      //       } else if (fieldName.toLowerCase().includes('address')) {
      //         dummyText = '123 Main Street, Toronto, ON M1A 1A1';
      //       } else if (fieldName.toLowerCase().includes('email')) {
      //         dummyText = 'contact@example.com';
      //       } else if (fieldName.toLowerCase().includes('number') || fieldName.toLowerCase().includes('amount')) {
      //         dummyText = '1234';
      //       }
      //       (field as any).setText(dummyText);

      //       // Set text color to black
      //       try {
      //         if ((field as any).setTextColor) {
      //           (field as any).setTextColor({ r: 0, g: 0, b: 0 }); // Black color
      //         }
      //       } catch (e) {
      //         console.log(`Could not set text color for field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      //       }

      //       filledCount++;
      //     } else if (fieldType === 'PDFCheckBox') {
      //       const shouldCheck = Math.random() > 0.5;
      //       if (shouldCheck) {
      //         (field as any).check();
      //       } else {
      //         (field as any).uncheck();
      //       }
      //       filledCount++;
      //     } else if (fieldType === 'PDFRadioGroup') {
      //       try {
      //         const options = (field as any).getOptions();
      //         if (options && options.length > 0) {
      //           (field as any).select(options[0]);
      //         }
      //       } catch (e) {
      //         const commonValues = ['1', 'A', 'Yes', 'Option1'];
      //         for (const val of commonValues) {
      //           try {
      //             (field as any).select(val);
      //             break;
      //           } catch {}
      //         }
      //       }
      //       filledCount++;
      //     }
      //   } catch (error) {
      //     console.log(`Could not fill unmapped field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      //   }
      // }
    });

    // console.log(`=== PROCESSING N4_Acro.pdf ===`);
    // console.log(`Total fields found: ${fields.length}`);

    // Create data mapping for N4 using the form data
    // const fillData: Record<string, string | boolean> = {
    //   // === NOTICE NAME AND ADDRESS SECTION ===
    //   'form1[0].#subform[0].Notice_Name_and_Address[0].TO_TenameName[0]': formData.tenantNames || 'Tenant Name',
    //   'form1[0].#subform[0].Notice_Name_and_Address[0].From_LandlordName[0]': formData.landlordName || 'Landlord Name',
    //   'form1[0].#subform[0].Notice_Name_and_Address[0].RentalUnitAddress[0]': formData.propertyAddress || 'Property Address',
    //   'form1[0].#subform[0].TerminationDate[0]': formData.terminationDate || '15/08/2025',

    //   // === RENT CALCULATION TABLE ===
    //   // Row 1 - Rent Period 1
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].ArrearFrom1[0]': formData.rentalPeriods?.[0]?.fromDate ? new Date(formData.rentalPeriods[0].fromDate).toLocaleDateString('en-CA') : '01/01/2024',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].ArrearTo1[0]': formData.rentalPeriods?.[0]?.toDate ? new Date(formData.rentalPeriods[0].toDate).toLocaleDateString('en-CA') : '31/01/2024',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentCharge1[0]': formData.rentalPeriods?.[0]?.lawfulRent ? `  ${parseFloat(formData.rentalPeriods[0].lawfulRent).toFixed(2)}` : '  1200.00',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentPaid1[0]': formData.rentalPeriods?.[0]?.paidRent ? `   ${parseFloat(formData.rentalPeriods[0].paidRent).toFixed(2)}` : '   800.00',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentOwe1[0]': formData.rentalPeriods?.[0] ? `    ${(parseFloat(formData.rentalPeriods[0].lawfulRent || '0') - parseFloat(formData.rentalPeriods[0].paidRent || '0')).toFixed(2)}` : '    400.00',

    //   // Row 2 - Rent Period 2
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].ArrearFrom2[0]': formData.rentalPeriods?.[1]?.fromDate ? new Date(formData.rentalPeriods[1].fromDate).toLocaleDateString('en-CA') : '01/02/2024',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].ArrearTo2[0]': formData.rentalPeriods?.[1]?.toDate ? new Date(formData.rentalPeriods[1].toDate).toLocaleDateString('en-CA') : '29/02/2024',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentCharge2[0]': formData.rentalPeriods?.[1]?.lawfulRent ? `  ${parseFloat(formData.rentalPeriods[1].lawfulRent).toFixed(2)}` : '  1200.00',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentPaid2[0]': formData.rentalPeriods?.[1]?.paidRent ? `   ${parseFloat(formData.rentalPeriods[1].paidRent).toFixed(2)}` : '     0.00',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentOwe2[0]': formData.rentalPeriods?.[1] ? `    ${(parseFloat(formData.rentalPeriods[1].lawfulRent || '0') - parseFloat(formData.rentalPeriods[1].paidRent || '0')).toFixed(2)}` : '   1200.00',

    //   // Row 3 - Rent Period 3
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].ArrearFrom3[0]': formData.rentalPeriods?.[2]?.fromDate ? new Date(formData.rentalPeriods[2].fromDate).toLocaleDateString('en-CA') : '01/03/2024',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].ArrearTo3[0]': formData.rentalPeriods?.[2]?.toDate ? new Date(formData.rentalPeriods[2].toDate).toLocaleDateString('en-CA') : '31/03/2024',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentCharge3[0]': formData.rentalPeriods?.[2]?.lawfulRent ? `  ${parseFloat(formData.rentalPeriods[2].lawfulRent).toFixed(2)}` : '  1200.00',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentPaid3[0]': formData.rentalPeriods?.[2]?.paidRent ? `   ${parseFloat(formData.rentalPeriods[2].paidRent).toFixed(2)}` : '     0.00',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentOwe3[0]': formData.rentalPeriods?.[2] ? `    ${(parseFloat(formData.rentalPeriods[2].lawfulRent || '0') - parseFloat(formData.rentalPeriods[2].paidRent || '0')).toFixed(2)}` : '   1200.00',

    //   // Total Rent Owing
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].TotalRentOwe[0]': `    ${formData.totalRentOwing || '2500.00'}`,

    //   // === MAIN AMOUNT OWED ===
    //   'form1[0].#subform[1].OweMeAmount[0]': `   ${formData.totalRentOwing || '2500.00'}`,

    //   // === N4 REASON SECTION ===
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason[0]': 'A1',
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_A1[0]': true,  // Non-payment of rent
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_A2[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_A3[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_A4[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_A5[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_A6[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B1[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B2[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B3[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B4[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B5[0]': false,
    //   'form1[0].#subform[0].N4_Notice[0].N4_Reason_B6[0]': false,

    //   // === OFFICE USE ONLY SECTION ===
    //   'form1[0].#subform[0].office_use_only_2[0].FileNumber[0]': 'LBT-2024-001234',
    //   'form1[0].#subform[0].office_use_only_2[0].DeliveryMethod[0]': 'Personal',
    //   'form1[0].#subform[0].office_use_only_2[0].FilingLocation[0]': 'Toronto East LTB Office',

    //   // === SIGNATURE SECTION ===
    //   'form1[0].#subform[3].SelectSign[0]': formData.whoAreYou === 'legal' ? 'Legal Representative' : 'Landlord',
    //   'form1[0].#subform[3].Signature_for_Notice_N4[0].RFirstName[0]': formData.name?.split(' ')[0] || 'First',
    //   'form1[0].#subform[3].Signature_for_Notice_N4[0].RLastName[0]': formData.name?.split(' ').slice(1).join(' ') || 'Last',
    //   'form1[0].#subform[3].Signature_for_Notice_N4[0].RDayPhone[0]': formData.phoneNumber || '(416)555-0123',
    //   'form1[0].#subform[3].Signature_for_Notice_N4[0].Signature[0]': formData.name || 'Signature',
    //   'form1[0].#subform[3].Signature_for_Notice_N4[0].SignDate[0]': formData.serveDate ? new Date(formData.serveDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),

    //   // === AGENT INFORMATION SECTION ===
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentName[0]': formData.name || 'Agent Name',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentLSUC[0]': formData.lsucNumber || '67890',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentCompany[0]': formData.companyName || 'Company Name',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentAddress[0]': formData.mailingAddress || 'Mailing Address',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentPhoneNum[0]': formData.phoneNumber || '(416)555-0456',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentMunicipality[0]': formData.municipality || 'Toronto',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentProvince[0]': formData.province || 'Ontario',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentPostCode[0]': formData.postalCode || 'M5G 1M5',
    //   'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentFaxNum[0]': formData.faxNumber || '(416)555-0457'
    // };

    // Fill the form fields with form data
    // console.log(`=== FILLING N4 FIELDS ===`);
    // let filledCount = 0;

    // Fill all fields first, except phone fields (we'll handle them separately)
    // fields.forEach(field => {
    //   const fieldName = field.getName();
    //   const fieldType = field.constructor.name;

    //   // Skip phone fields - we'll handle them separately at the end
    //   if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('fax')) {
    //     return;
    //   }

    //   // Use the full field name to match with form data
    //   if (fillData[fieldName] !== undefined) {
    //     try {
    //       if (fieldType === 'PDFTextField') {
    //         // Special handling for amount fields - set right alignment
    //         if (fieldName.toLowerCase().includes('amount') ||
    //             fieldName.toLowerCase().includes('rent') ||
    //             fieldName.toLowerCase().includes('charge') ||
    //             fieldName.toLowerCase().includes('paid') ||
    //             fieldName.toLowerCase().includes('owe')) {
    //           try {
    //             // Try to set right alignment for amount fields
    //             if ((field as any).setAlignment) {
    //               (field as any).setAlignment('right');
    //             }
    //             if ((field as any).setTextAlignment) {
    //               (field as any).setTextAlignment('right');
    //             }
    //           } catch (e) {
    //             console.log(`Could not set alignment for amount field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //           }
    //         }
    //         (field as any).setText(fillData[fieldName].toString());

    //         // Set text color to black
    //         try {
    //           if ((field as any).setTextColor) {
    //             (field as any).setTextColor({ r: 0, g: 0, b: 0 }); // Black color
    //           }
    //         } catch (e) {
    //           console.log(`Could not set text color for field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }

    //         filledCount++;
    //       } else if (fieldType === 'PDFCheckBox') {
    //         if (fillData[fieldName] === true) {
    //           (field as any).check();
    //         } else {
    //           (field as any).uncheck();
    //         }
    //         filledCount++;
    //       } else if (fieldType === 'PDFRadioGroup') {
    //         const radioValue = fillData[fieldName].toString();
    //         try {
    //           const options = (field as any).getOptions();
    //           if (options && options.length > 0) {
    //             const optionToSelect = options.find((opt: string) => opt.toLowerCase().includes(radioValue.toLowerCase())) || options[0];
    //             (field as any).select(optionToSelect);
    //           } else {
    //             (field as any).select(radioValue);
    //           }
    //         } catch (e) {
    //           const commonValues = [radioValue, radioValue.toUpperCase(), radioValue.toLowerCase(), '1', '0', 'Yes', 'No'];
    //           let selected = false;
    //           for (const val of commonValues) {
    //             try {
    //               (field as any).select(val);
    //               selected = true;
    //               break;
    //             } catch {}
    //           }
    //           if (!selected) {
    //             console.log(`Could not select radio option for ${fieldName}`);
    //           }
    //         }
    //         filledCount++;
    //       } else if (fieldType === 'PDFDropdown') {
    //         try {
    //           (field as any).select(fillData[fieldName].toString());
    //         } catch (e) {
    //           (field as any).setText(fillData[fieldName].toString());
    //         }
    //         filledCount++;
    //       }
    //     } catch (error) {
    //       console.log(`Could not fill field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //     }
    //   } else {
    //     // Fill fields not in our predefined list with generic dummy data
    //     try {
    //       if (fieldType === 'PDFTextField') {
    //         let dummyText = 'Sample Text';
    //         if (fieldName.toLowerCase().includes('date')) {
    //           dummyText = '15/08/2024';
    //         } else if (fieldName.toLowerCase().includes('TO_Te') && fieldName.toLowerCase().includes('name')) {
    //           dummyText = 'Sarah Johnson';
    //         } else if (fieldName.toLowerCase().includes('landlord') && fieldName.toLowerCase().includes('name')) {
    //           dummyText = 'Robert Williams';
    //         } else if (fieldName.toLowerCase().includes('agent') && fieldName.toLowerCase().includes('name')) {
    //           dummyText = 'David Thompson';
    //         } else if (fieldName.toLowerCase().includes('name')) {
    //           dummyText = 'Robert Williams';
    //         } else if (fieldName.toLowerCase().includes('rental')) {
    //           dummyText = '456 Oak Avenue, Suite 201, Mississauga, ON L5B 2C3';
    //         } else if (fieldName.toLowerCase().includes('agent') && fieldName.toLowerCase().includes('address')) {
    //           dummyText = '789 Bay Street, Floor 15, Toronto, ON M5G 1M5';
    //         } else if (fieldName.toLowerCase().includes('address')) {
    //           dummyText = '123 Main Street, Toronto, ON M1A 1A1';
    //         } else if (fieldName.toLowerCase().includes('email')) {
    //           dummyText = 'contact@example.com';
    //         } else if (fieldName.toLowerCase().includes('number') || fieldName.toLowerCase().includes('amount')) {
    //           dummyText = '1234';
    //         }
    //         (field as any).setText(dummyText);

    //         // Set text color to black
    //         try {
    //           if ((field as any).setTextColor) {
    //             (field as any).setTextColor({ r: 0, g: 0, b: 0 }); // Black color
    //           }
    //         } catch (e) {
    //           console.log(`Could not set text color for field ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }

    //         filledCount++;
    //       } else if (fieldType === 'PDFCheckBox') {
    //         const shouldCheck = Math.random() > 0.5;
    //         if (shouldCheck) {
    //           (field as any).check();
    //         } else {
    //           (field as any).uncheck();
    //         }
    //         filledCount++;
    //       } else if (fieldType === 'PDFRadioGroup') {
    //         try {
    //           const options = (field as any).getOptions();
    //           if (options && options.length > 0) {
    //             (field as any).select(options[0]);
    //           }
    //         } catch (e) {
    //           const commonValues = ['1', 'A', 'Yes', 'Option1'];
    //           for (const val of commonValues) {
    //             try {
    //               (field as any).select(val);
    //               break;
    //             } catch {}
    //           }
    //         }
    //         filledCount++;
    //       }
    //     } catch (error) {
    //       console.log(`Could not fill unmapped field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //     }
    //   }
    // });

    // Special handling for rent amount fields - try to fill them explicitly
    // console.log(`=== FILLING RENT AMOUNT FIELDS EXPLICITLY ===`);
    // const rentAmountFields = [
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentCharge1[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentPaid1[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row1[0].RentOwe1[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentCharge2[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentPaid2[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row2[0].RentOwe2[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentCharge3[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentPaid3[0]',
    //   'form1[0].#subform[4].LTHAS_Arrear_L1[0].Table1[0].Row3[0].RentOwe3[0]'
    // ];

    // rentAmountFields.forEach(fieldName => {
    //   const field = fields.find(f => f.getName() === fieldName);
    //   if (field && fillData[fieldName]) {
    //     console.log(`🎯 Explicitly filling rent field: ${fieldName} with "${fillData[fieldName]}"`);
    //     try {
    //       // Try multiple approaches to fill the field
    //       let success = false;

    //       // Method 1: Enable field first, then set text
    //       try {
    //         (field as any).enable();
    //         (field as any).setText(fillData[fieldName].toString());
    //         console.log(`✅ Method 1 (enable + setText) succeeded for ${fieldName}`);
    //         success = true;
    //       } catch (e) {
    //         console.log(`❌ Method 1 failed for ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //       }

    //       // Method 2: Try setText directly
    //       if (!success) {
    //         try {
    //           (field as any).setText(fillData[fieldName].toString());
    //           console.log(`✅ Method 2 (setText) succeeded for ${fieldName}`);
    //           success = true;
    //         } catch (e) {
    //           console.log(`❌ Method 2 failed for ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }
    //       }

    //       // Method 3: Try updateAppearances then setText
    //       if (!success) {
    //         try {
    //           (field as any).updateAppearances();
    //           (field as any).setText(fillData[fieldName].toString());
    //           console.log(`✅ Method 3 (updateAppearances + setText) succeeded for ${fieldName}`);
    //           success = true;
    //         } catch (e) {
    //           console.log(`❌ Method 3 failed for ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }
    //       }

    //       if (success) {
    //         // Set right alignment
    //         try {
    //           if ((field as any).setAlignment) {
    //             (field as any).setAlignment('right');
    //           }
    //           if ((field as any).setTextAlignment) {
    //             (field as any).setTextAlignment('right');
    //           }
    //         } catch (e) {
    //           console.log(`Could not set alignment for ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }

    //         // Set text color to black
    //         try {
    //           if ((field as any).setTextColor) {
    //             (field as any).setTextColor({ r: 0, g: 0, b: 0 });
    //           }
    //         } catch (e) {
    //           console.log(`Could not set text color for ${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }

    //         filledCount++;
    //       }
    //     } catch (error) {
    //       console.log(`❌ All methods failed for ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //     }
    //   } else {
    //     console.log(`❌ Field not found or no dummy data: ${fieldName}`);
    //   }
    // });

    // Handle phone fields with special formatting
    // console.log(`=== FILLING PHONE FIELDS ===`);
    // const phoneFields = fields.filter(field =>
    //   field.getName().toLowerCase().includes('phone') ||
    //   field.getName().toLowerCase().includes('fax')
    // );

    // phoneFields.forEach(phoneField => {
    //   const fieldName = phoneField.getName();
    //   console.log(`📞 Processing phone field: ${fieldName}`);

    //   try {
    //     const phoneFormats = [
    //       '(416)555-0123',   // Parentheses no space (preferred format)
    //       '(416) 555-0123',  // Parentheses with space
    //       '416-555-0123',    // Dash format
    //       '416.555.0123',    // Dot format
    //       '416 555 0123',    // Space format
    //       '4165550123',      // No formatting
    //     ];

    //     let success = false;
    //     for (let i = 0; i < phoneFormats.length; i++) {
    //       try {
    //         (phoneField as any).setText(phoneFormats[i]);

    //         // Set text color to black for phone fields
    //         try {
    //           if ((phoneField as any).setTextColor) {
    //             (phoneField as any).setTextColor({ r: 0, g: 0, b: 0 }); // Black color
    //           }
    //         } catch (e) {
    //           console.log(`Could not set text color for phone field: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //         }

    //         console.log(`✅ Phone field filled with "${phoneFormats[i]}"`);
    //         success = true;
    //         break;
    //       } catch (e) {
    //         console.log(`❌ Format ${i + 1} failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //       }
    //     }

    //     if (!success) {
    //       try {
    //         (phoneField as any).enable();
    //         (phoneField as any).setText('(416)555-0123');
    //         console.log(`✅ Phone field filled after enable`);
    //         success = true;
    //       } catch (e) {
    //         console.log(`❌ Enable + setText failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    //       }
    //     }

    //     if (success) {
    //       filledCount++;
    //     }
    //   } catch (error) {
    //     console.log(`❌ Error filling phone field ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //   }
    // });

    // console.log(`=== FILLING SUMMARY FOR N4 ===`);
    // console.log(`Fields filled: ${filledCount}`);
    // console.log(`Total fields: ${fields.length}`);

    // const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // pdfDoc.getForm().updateFieldAppearances(helvetica);
    // // Optional:
    // pdfDoc.getForm().flatten();

    // Helper function to calculate rent owing
    const calculateRentOwing = (
      lawfulRent: string,
      paidRent: string,
    ): number => {
      const lawful = parseFloat(lawfulRent) || 0;
      const paid = parseFloat(paidRent) || 0;
      return Math.max(0, lawful - paid);
    };

    // Add a new page at the end with rental period details
    // Set to true to include "All Rental Periods Details" page at end of PDF
    const ENABLE_RENTAL_PERIODS_PAGE = false;
    const rentalPeriodsToDisplay =
      formData.allRentalPeriods || formData.rentalPeriods || [];
    if (
      ENABLE_RENTAL_PERIODS_PAGE &&
      rentalPeriodsToDisplay &&
      rentalPeriodsToDisplay.length > 0
    ) {
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(
        StandardFonts.HelveticaBold,
      );

      // Black color for all text
      const blackColor = rgb(0, 0, 0);

      // Add a new page at the end of the PDF
      let currentPage = pdfDoc.addPage([612, 792]); // Standard US Letter size (8.5" x 11")

      // Page dimensions
      const pageWidth = 612;
      const pageHeight = 792;

      // Column widths (optimized for better spacing and centering)
      const rentPeriodColWidth = 250; // Combined From and To dates
      const fromDateColWidth = 125;
      const toDateColWidth = 125;
      const rentChargedColWidth = 115;
      const rentPaidColWidth = 115;
      const rentOwingColWidth = 115;

      // Calculate total table width
      const tableWidth =
        rentPeriodColWidth +
        rentChargedColWidth +
        rentPaidColWidth +
        rentOwingColWidth; // = 595

      // Calculate centered table margins (equal spacing from both sides)
      const margin = (pageWidth - tableWidth) / 2; // Equal margins on both sides

      // Column X positions (centered)
      const fromDateX = margin;
      const toDateX = margin + fromDateColWidth;
      const rentChargedX = margin + rentPeriodColWidth;
      const rentPaidX = margin + rentPeriodColWidth + rentChargedColWidth;
      const rentOwingX =
        margin + rentPeriodColWidth + rentChargedColWidth + rentPaidColWidth;

      let yPosition = 750; // Start position
      const rowHeight = 25; // Height of each row
      const headerHeight = 30; // Slightly taller header for sub-headers

      // Draw title "All Rental Periods Details" centered at the top
      const titleText = "All Rental Periods Details";
      const titleSize = 14;
      const titleWidth = helveticaBoldFont.widthOfTextAtSize(
        titleText,
        titleSize,
      );
      currentPage.drawText(titleText, {
        x: (pageWidth - titleWidth) / 2,
        y: yPosition,
        size: titleSize,
        font: helveticaBoldFont,
        color: blackColor,
      });

      yPosition -= 40; // Space after title

      // Helper function to draw a rectangle (cell border)
      // skipTop, skipBottom, skipLeft, skipRight allow selective border drawing
      const drawCellBorder = (
        x: number,
        y: number,
        width: number,
        height: number,
        skipTop: boolean = false,
        skipBottom: boolean = false,
        skipLeft: boolean = false,
        skipRight: boolean = false,
      ) => {
        // Top line
        if (!skipTop) {
          currentPage.drawLine({
            start: { x, y },
            end: { x: x + width, y },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        }
        // Bottom line
        if (!skipBottom) {
          currentPage.drawLine({
            start: { x, y: y - height },
            end: { x: x + width, y: y - height },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        }
        // Left line
        if (!skipLeft) {
          currentPage.drawLine({
            start: { x, y },
            end: { x, y: y - height },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        }
        // Right line
        if (!skipRight) {
          currentPage.drawLine({
            start: { x: x + width, y },
            end: { x: x + width, y: y - height },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        }
      };

      // Draw header row
      const headerY = yPosition;

      // Draw header cells with borders
      // "Rent Period" header cell (spans From and To columns)
      // Skip right border to avoid double line
      drawCellBorder(
        fromDateX,
        headerY,
        rentPeriodColWidth,
        headerHeight,
        false,
        false,
        false,
        true,
      );
      const rentPeriodText = "Rent Period";
      const rentPeriodTextWidth = helveticaBoldFont.widthOfTextAtSize(
        rentPeriodText,
        10,
      );
      currentPage.drawText(rentPeriodText, {
        x: fromDateX + (rentPeriodColWidth - rentPeriodTextWidth) / 2,
        y: headerY - 10,
        size: 10,
        font: helveticaBoldFont,
        color: blackColor,
      });

      // Sub-headers for From and To (centered in their respective columns)
      const fromText = "From: (dd/mm/yyyy)";
      const fromTextWidth = helveticaFont.widthOfTextAtSize(fromText, 8);
      currentPage.drawText(fromText, {
        x: fromDateX + (fromDateColWidth - fromTextWidth) / 2,
        y: headerY - 22,
        size: 8,
        font: helveticaFont,
        color: blackColor,
      });
      const toText = "To: (dd/mm/yyyy)";
      const toTextWidth = helveticaFont.widthOfTextAtSize(toText, 8);
      currentPage.drawText(toText, {
        x: toDateX + (toDateColWidth - toTextWidth) / 2,
        y: headerY - 22,
        size: 8,
        font: helveticaFont,
        color: blackColor,
      });

      // "Rent Charged $" header
      // Skip right border to avoid double line
      drawCellBorder(
        rentChargedX,
        headerY,
        rentChargedColWidth,
        headerHeight,
        false,
        false,
        false,
        true,
      );
      const rentChargedText = "Rent Charged $";
      const rentChargedTextWidth = helveticaBoldFont.widthOfTextAtSize(
        rentChargedText,
        10,
      );
      currentPage.drawText(rentChargedText, {
        x: rentChargedX + (rentChargedColWidth - rentChargedTextWidth) / 2,
        y: headerY - 18,
        size: 10,
        font: helveticaBoldFont,
        color: blackColor,
      });

      // "Rent Paid $" header
      // Skip right border to avoid double line
      drawCellBorder(
        rentPaidX,
        headerY,
        rentPaidColWidth,
        headerHeight,
        false,
        false,
        false,
        true,
      );
      const rentPaidText = "Rent Paid $";
      const rentPaidTextWidth = helveticaBoldFont.widthOfTextAtSize(
        rentPaidText,
        10,
      );
      currentPage.drawText(rentPaidText, {
        x: rentPaidX + (rentPaidColWidth - rentPaidTextWidth) / 2,
        y: headerY - 18,
        size: 10,
        font: helveticaBoldFont,
        color: blackColor,
      });

      // "Rent Owing $" header
      drawCellBorder(rentOwingX, headerY, rentOwingColWidth, headerHeight);
      const rentOwingText = "Rent Owing $";
      const rentOwingTextWidth = helveticaBoldFont.widthOfTextAtSize(
        rentOwingText,
        10,
      );
      currentPage.drawText(rentOwingText, {
        x: rentOwingX + (rentOwingColWidth - rentOwingTextWidth) / 2,
        y: headerY - 18,
        size: 10,
        font: helveticaBoldFont,
        color: blackColor,
      });

      yPosition -= headerHeight;

      // Store starting Y position for outer table border
      const tableTopY = headerY;
      let tableBottomY = yPosition; // Will be updated after all rows are drawn

      // Draw data rows
      rentalPeriodsToDisplay.forEach((period: any) => {
        // Check if we need a new page (leave space for total row)
        if (yPosition < 120) {
          // Add a new page at the end
          currentPage = pdfDoc.addPage([612, 792]);
          yPosition = 750;

          // Redraw title
          const titleText = "All Rental Periods Details";
          const titleSize = 14;
          const titleWidth = helveticaBoldFont.widthOfTextAtSize(
            titleText,
            titleSize,
          );
          currentPage.drawText(titleText, {
            x: (pageWidth - titleWidth) / 2,
            y: yPosition,
            size: titleSize,
            font: helveticaBoldFont,
            color: blackColor,
          });
          yPosition -= 40;

          // Redraw headers on new page
          drawCellBorder(
            fromDateX,
            yPosition,
            rentPeriodColWidth,
            headerHeight,
            false,
            false,
            false,
            true,
          );
          const rentPeriodText2 = "Rent Period";
          const rentPeriodTextWidth2 = helveticaBoldFont.widthOfTextAtSize(
            rentPeriodText2,
            10,
          );
          currentPage.drawText(rentPeriodText2, {
            x: fromDateX + (rentPeriodColWidth - rentPeriodTextWidth2) / 2,
            y: yPosition - 10,
            size: 10,
            font: helveticaBoldFont,
            color: blackColor,
          });
          const fromText2 = "From: (dd/mm/yyyy)";
          const fromTextWidth2 = helveticaFont.widthOfTextAtSize(fromText2, 8);
          currentPage.drawText(fromText2, {
            x: fromDateX + (fromDateColWidth - fromTextWidth2) / 2,
            y: yPosition - 22,
            size: 8,
            font: helveticaFont,
            color: blackColor,
          });
          const toText2 = "To: (dd/mm/yyyy)";
          const toTextWidth2 = helveticaFont.widthOfTextAtSize(toText2, 8);
          currentPage.drawText(toText2, {
            x: toDateX + (toDateColWidth - toTextWidth2) / 2,
            y: yPosition - 22,
            size: 8,
            font: helveticaFont,
            color: blackColor,
          });
          drawCellBorder(
            rentChargedX,
            yPosition,
            rentChargedColWidth,
            headerHeight,
            false,
            false,
            false,
            true,
          );
          const rentChargedText2 = "Rent Charged $";
          const rentChargedTextWidth2 = helveticaBoldFont.widthOfTextAtSize(
            rentChargedText2,
            10,
          );
          currentPage.drawText(rentChargedText2, {
            x: rentChargedX + (rentChargedColWidth - rentChargedTextWidth2) / 2,
            y: yPosition - 18,
            size: 10,
            font: helveticaBoldFont,
            color: blackColor,
          });
          drawCellBorder(
            rentPaidX,
            yPosition,
            rentPaidColWidth,
            headerHeight,
            false,
            false,
            false,
            true,
          );
          const rentPaidText2 = "Rent Paid $";
          const rentPaidTextWidth2 = helveticaBoldFont.widthOfTextAtSize(
            rentPaidText2,
            10,
          );
          currentPage.drawText(rentPaidText2, {
            x: rentPaidX + (rentPaidColWidth - rentPaidTextWidth2) / 2,
            y: yPosition - 18,
            size: 10,
            font: helveticaBoldFont,
            color: blackColor,
          });
          drawCellBorder(
            rentOwingX,
            yPosition,
            rentOwingColWidth,
            headerHeight,
          );
          const rentOwingText2 = "Rent Owing $";
          const rentOwingTextWidth2 = helveticaBoldFont.widthOfTextAtSize(
            rentOwingText2,
            10,
          );
          currentPage.drawText(rentOwingText2, {
            x: rentOwingX + (rentOwingColWidth - rentOwingTextWidth2) / 2,
            y: yPosition - 18,
            size: 10,
            font: helveticaBoldFont,
            color: blackColor,
          });
          yPosition -= headerHeight;
        }

        const rowY = yPosition;

        // Draw cell borders for data row
        // From date cell (left-aligned)
        drawCellBorder(fromDateX, rowY, fromDateColWidth, rowHeight);
        currentPage.drawText(period.fromDate || "-", {
          x: fromDateX + 5,
          y: rowY - 18,
          size: 9,
          font: helveticaFont,
          color: blackColor,
        });

        // To date cell (left-aligned)
        // Skip left border to avoid double line with From date column
        drawCellBorder(
          toDateX,
          rowY,
          toDateColWidth,
          rowHeight,
          false,
          false,
          true,
          false,
        );
        currentPage.drawText(period.toDate || "-", {
          x: toDateX + 5,
          y: rowY - 18,
          size: 9,
          font: helveticaFont,
          color: blackColor,
        });

        // Rent Charged cell (right-aligned numbers)
        // Skip right border to avoid double line with Rent Paid column
        drawCellBorder(
          rentChargedX,
          rowY,
          rentChargedColWidth,
          rowHeight,
          false,
          false,
          false,
          true,
        );
        const rentCharged = parseFloat(period.lawfulRent || "0").toFixed(2);
        const chargedWidth = helveticaFont.widthOfTextAtSize(rentCharged, 9);
        currentPage.drawText(rentCharged, {
          x: rentChargedX + rentChargedColWidth - chargedWidth - 5,
          y: rowY - 18,
          size: 9,
          font: helveticaFont,
          color: blackColor,
        });

        // Rent Paid cell (right-aligned numbers)
        // Skip right border to avoid double line with Rent Owing column
        drawCellBorder(
          rentPaidX,
          rowY,
          rentPaidColWidth,
          rowHeight,
          false,
          false,
          false,
          true,
        );
        const rentPaid = parseFloat(period.paidRent || "0").toFixed(2);
        const paidWidth = helveticaFont.widthOfTextAtSize(rentPaid, 9);
        currentPage.drawText(rentPaid, {
          x: rentPaidX + rentPaidColWidth - paidWidth - 5,
          y: rowY - 18,
          size: 9,
          font: helveticaFont,
          color: blackColor,
        });

        // Rent Owing cell (right-aligned numbers)
        // This cell's left border serves as the divider from Rent Paid
        drawCellBorder(rentOwingX, rowY, rentOwingColWidth, rowHeight);
        const rentOwing = calculateRentOwing(
          period.lawfulRent || "0",
          period.paidRent || "0",
        ).toFixed(2);
        const owingWidth = helveticaFont.widthOfTextAtSize(rentOwing, 9);
        currentPage.drawText(rentOwing, {
          x: rentOwingX + rentOwingColWidth - owingWidth - 5,
          y: rowY - 18,
          size: 9,
          font: helveticaFont,
          color: blackColor,
        });

        yPosition -= rowHeight;
      });

      // Draw total row - inside the table border (as part of the table structure)
      // Calculate total rent owing
      const totalRentOwing = rentalPeriodsToDisplay.reduce(
        (sum: number, period: any) =>
          sum +
          calculateRentOwing(period.lawfulRent || "0", period.paidRent || "0"),
        0,
      );

      const totalY = yPosition;
      const totalRowHeight = rowHeight;

      // Draw empty cell for Rent Period column only
      // Skip right border since it will connect with the merged total cell
      drawCellBorder(
        fromDateX,
        totalY,
        rentPeriodColWidth,
        totalRowHeight,
        false,
        false,
        false,
        true,
      ); // Empty Rent Period cell

      // Draw merged "Total Rent Owing $" cell - spans Rent Charged, Rent Paid, and Rent Owing columns
      // No vertical lines inside this merged cell - it's one continuous cell
      const totalCellStartX = rentChargedX;
      const totalCellWidth =
        rentChargedColWidth + rentPaidColWidth + rentOwingColWidth; // Span all three columns
      // Draw full border for the merged cell - this creates one cell without internal dividers
      drawCellBorder(totalCellStartX, totalY, totalCellWidth, totalRowHeight);

      // Draw "Total Rent Owing $" label and value in the same cell
      const labelText = "Total Rent Owing $";
      const valueText = totalRentOwing.toFixed(2);

      // Draw label (left-aligned in the cell)
      currentPage.drawText(labelText, {
        x: totalCellStartX + 5,
        y: totalY - 18,
        size: 10,
        font: helveticaBoldFont,
        color: blackColor,
      });

      // Draw value (right-aligned in the cell)
      const valueWidth = helveticaBoldFont.widthOfTextAtSize(valueText, 10);
      currentPage.drawText(valueText, {
        x: totalCellStartX + totalCellWidth - valueWidth - 5,
        y: totalY - 18,
        size: 10,
        font: helveticaBoldFont,
        color: blackColor,
      });

      // Update table bottom Y position
      tableBottomY = totalY - totalRowHeight;

      // Draw outer table border around the entire table
      const outerBorderThickness = 1;
      // Top border
      currentPage.drawLine({
        start: { x: margin, y: tableTopY },
        end: { x: margin + tableWidth, y: tableTopY },
        thickness: outerBorderThickness,
        color: rgb(0, 0, 0),
      });
      // Bottom border
      currentPage.drawLine({
        start: { x: margin, y: tableBottomY },
        end: { x: margin + tableWidth, y: tableBottomY },
        thickness: outerBorderThickness,
        color: rgb(0, 0, 0),
      });
      // Left border
      currentPage.drawLine({
        start: { x: margin, y: tableTopY },
        end: { x: margin, y: tableBottomY },
        thickness: outerBorderThickness,
        color: rgb(0, 0, 0),
      });
      // Right border
      currentPage.drawLine({
        start: { x: margin + tableWidth, y: tableTopY },
        end: { x: margin + tableWidth, y: tableBottomY },
        thickness: outerBorderThickness,
        color: rgb(0, 0, 0),
      });
    }

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    // Return the PDF as a response
    return new NextResponse(filledPdfBytes as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="N4.pdf"',
        "Content-Length": filledPdfBytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error filling N4 PDF:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fill N4 PDF: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    );
  }
}
