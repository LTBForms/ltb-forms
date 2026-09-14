import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import {
  PDFField,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFButton,
  PDFSignature,
} from 'pdf-lib';

function getFieldType(field: PDFField):
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'optionlist'
  | 'button'
  | 'signature'
  | 'unknown' {
  if (field instanceof PDFTextField) return 'text';
  if (field instanceof PDFCheckBox) return 'checkbox';
  if (field instanceof PDFRadioGroup) return 'radio';
  if (field instanceof PDFDropdown) return 'dropdown';
  if (field instanceof PDFOptionList) return 'optionlist';
  if (field instanceof PDFButton) return 'button';
  if (field instanceof PDFSignature) return 'signature';
  return 'unknown';
}
// Helper function to convert ISO date (YYYY-MM-DD) to dd/mm/yyyy format
function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get form data
    const formData = await request.json();
    console.log('Received N8 form data:', formData);

    // Load the N8 PDF
    const pdfPath = path.join(process.cwd(), 'public', 'templates', 'N8_Acro.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    let filledCount = 0;

    fields.forEach(field => {
      console.log("🔥 FIELD", field);
      const fieldName = field.getName();
      // const fieldType = field.constructor.name;
      const fieldType = getFieldType(field);
      console.log(`📝 Field: ${fieldName} | Type: ${fieldType}`);

      if (fieldType === 'text') {
        console.log("Processing PDFTextField...");

        try {
          // Use exact matching instead of includes to avoid false positives
          if (fieldName.includes('form1[0].#subform[0].Notice_Name_and_Address[0].TO_TenameName[0]')) {
            console.log("✅ Filling TENANT NAME field");
            // Handle tenantNames as either array or comma-separated string
            const tenantNames = Array.isArray(formData.tenantNames)
              ? formData.tenantNames.join(', ')
              : formData.tenantNames || 'Tenant Name';
            (field as any).setText(tenantNames);
          } else if (fieldName == 'form1[0].#subform[0].Notice_Name_and_Address[0].From_LandlordName[0]') {
            console.log("✅ Filling LANDLORD NAME field");
            (field as any).setText(formData.landlordName || 'Landlord Name');
          } else if (fieldName == 'form1[0].#subform[0].Notice_Name_and_Address[0].RentalUnitAddress[0]') {
            console.log("✅ Filling RENTAL ADDRESS field");
            (field as any).setText(formData.rentalAddress || 'Property Address');
          } else if (fieldName == 'form1[0].#subform[0].TerminationDate[0]') {
            console.log("✅ Filling TERMINATION DATE field");
            (field as any).setText(formData.terminationDate || "");
          }


          // Payment dates field
          else if (fieldName.includes('PaymentDates') || fieldName.includes('payment') && formData.paymentDates) {
            console.log("✅ Filling PAYMENT DATES field");
            (field as any).setText(formData.paymentDates || '');
          }

          // Late payment explanation field
          else if (fieldName.includes('LatePaymentExplanation') || fieldName.includes('explanation') && formData.latePaymentExplanation) {
            console.log("✅ Filling LATE PAYMENT EXPLANATION field");
            (field as any).setText(formData.latePaymentExplanation || '');
          }

          // Notice details field (combined field with headings)
          else if (fieldName.includes('form1[0].#subform[0].NoticeDetail[0]')) {
            console.log("✅ Filling NOTICE DETAILS field");
            (field as any).setText(formData.noticeDetails || '');
          }

          // Signature fields
          else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice[0].RFirstName[0]') {
            if (formData.whoAreYou === 'landlord') {
              console.log("✅ Filling FIRST NAME");
              (field as any).setText(formData.landlordName?.split(' ')[0] || '');
            }
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice[0].RLastName[0]') {
            if (formData.whoAreYou === 'landlord') {
              console.log("✅ Filling LAST NAME");
              (field as any).setText(formData.landlordName?.split(' ').slice(1).join(' ') || '');
            }
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice[0].RDayPhone[0]') {
            console.log("✅ Filling PHONE NUMBER");
            (field as any).setText(formData.landlordPhoneNumber || '');
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N8[0].Signature[0]') {
            console.log("✅ Filling SIGNATURE");
            (field as any).setText(formData.name || formData.landlordName || 'Signature');
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N8[0].SignDate[0]') {
            console.log("✅ Filling SIGNATURE DATE");
            (field as any).setText(formatDateToDDMMYYYY(formData.serveDate || ""));
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentName[0]') {
            console.log("✅ Filling AGENT NAME");
            (field as any).setText(formData.representativeName || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentLSUC[0]') {
            console.log("✅ Filling AGENT LSUC");
            (field as any).setText(formData.lsucNumber || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentCompany[0]') {
            console.log("✅ Filling AGENT COMPANY");
            (field as any).setText(formData.companyName || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentAddress[0]') {
            console.log("✅ Filling AGENT ADDRESS");
            (field as any).setText(formData.mailingAddress || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentPhoneNum[0]') {
            console.log("✅ Filling REPRESENTATIVE PHONE NUMBER");
            (field as any).setText(formData.representativePhoneNumber || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentMunicipality[0]') {
            console.log("✅ Filling AGENT MUNICIPALITY");
            (field as any).setText(formData.municipality || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentProvince[0]') {
            console.log("✅ Filling AGENT PROVINCE");
            (field as any).setText(formData.province || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentPostCode[0]') {
            console.log("✅ Filling AGENT POST CODE");
            (field as any).setText(formData.postalCode || '');
          } else if (fieldName == 'form1[0].#subform[3].Agent_Information_for_Notice[0].AgentFaxNum[0]') {
            console.log("✅ Filling AGENT FAX NUMBER");
            (field as any).setText(formData.faxNumber || '');
          }
          else {
            // Log any fields that don't match our expected field names
            console.log(`❌ UNMATCHED FIELD: ${fieldName}`);
          }

          filledCount++;
        } catch (error) {
          console.error(`❌ Error processing field ${fieldName}: ${error}`);
          throw new Error(`Failed to process field '${fieldName}': ${error}`);
        }
      }  
      if (fieldType === "checkbox") {
        // N8 reason fields - using checkboxes for multiple selection
        if (fieldName.includes('form1[0].#subform[0].Reason1[0]') && formData.selectedReasons?.includes('late_payment')) {
          console.log("✅ Filling LATE PAYMENT REASON checkbox");
          (field as any).check();
        } else if (fieldName.includes('form1[0].#subform[0].Reason2[0]') && formData.selectedReasons?.includes('no_longer_qualify')) {
          console.log("✅ Filling NO LONGER QUALIFY REASON checkbox");
          (field as any).check();
        } else if (fieldName.includes('form1[0].#subform[0].Reason3[0]') && formData.selectedReasons?.includes('employment_ended')) {
          console.log("✅ Filling EMPLOYMENT ENDED REASON checkbox");
          (field as any).check();
        } else if (fieldName.includes('form1[0].#subform[0].Reason4[0]') && formData.selectedReasons?.includes('purchase_sale_terminated')) {
          console.log("✅ Filling PURCHASE SALE TERMINATED REASON checkbox");
          (field as any).check();
        } else if (fieldName.includes('form1[0].#subform[0].Reason5[0]') && formData.selectedReasons?.includes('rehabilitative_services_ended')) {
          console.log("✅ Filling REHABILITATIVE SERVICES ENDED REASON checkbox");
          (field as any).check();
        } else {
          // Uncheck all other reason checkboxes
          // (field as any).uncheck();
        }
        filledCount++;
      }
      if (fieldType === "radio") {
        const data = {
          'form1[0].#subform[3].SelectSign[0]': formData.whoAreYou === 'legal' ? '2' : '1'
        }
        const radioValue = data[fieldName as keyof typeof data]?.toString();
        if (radioValue) {
          try {
            const options = (field as any).getOptions();
            console.log("🔥 RADIO GROUP OPTIONS", options);
            if (options && options.length > 0) {
              const optionToSelect = options.find((opt: string) => opt.toLowerCase().includes(radioValue.toLowerCase())) || options[0];
              console.log("✅ Filling RADIO GROUP", optionToSelect);
              (field as any).select(optionToSelect);
            } else {
              (field as any).select(radioValue);
            }
          } catch (e) {
            const commonValues = [radioValue, radioValue.toUpperCase(), radioValue.toLowerCase(), '1', '0', 'Yes', 'No'];
            let selected = false;
            for (const val of commonValues) {
              try {
                (field as any).select(val);
                selected = true;
                break;
              } catch { }
            }
            if (!selected) {
              console.log(`Could not select radio option for ${fieldName}`);
            }
          }
          filledCount++;
        }
      }
    });

    console.log(`=== FILLING SUMMARY FOR N8 ===`);
    console.log(`Fields filled: ${filledCount}`);
    console.log(`Total fields: ${fields.length}`);

    // const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    // pdfDoc.getForm().updateFieldAppearances(helvetica);
    // // Optional:
    // pdfDoc.getForm().flatten();


    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    // Return the PDF as a response
    return new NextResponse(filledPdfBytes as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="N8.pdf"',
        'Content-Length': filledPdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error filling N8 PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fill N8 PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
