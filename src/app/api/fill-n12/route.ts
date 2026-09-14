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
    console.log('Received N12 form data:', formData);

    // Load the N12 PDF
    const pdfPath = path.join(process.cwd(), 'public', 'templates', 'N12_Acro.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    let filledCount = 0;

    fields.forEach(field => {
      console.log("🔥 FIELD", getFieldType(field));
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

          // Signature fields
          else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N12[0].RFirstName[0]') {
            if (formData.whoAreYou === 'landlord') {
              console.log("✅ Filling FIRST NAME SIGNATURE LANDLORD");
              (field as any).setText(formData.landlordName?.split(' ')[0] || '');
            } else {
              console.log("✅ Filling FIRST NAME SIGNATURE LANDLORD");
              (field as any).setText(formData.representativeName?.split(' ')[0] || '');
            }
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N12[0].RLastName[0]') {
            if (formData.whoAreYou === 'landlord') {
              console.log("✅ Filling LAST NAME SIGNATURE LEGAL REPRESENTATVIE");
              (field as any).setText(formData.landlordName?.split(' ').slice(1).join(' ') || '');
            } else {
              console.log("✅ Filling LAST NAME SIGNATURE LEGAL REPRESENTATVIE");
              (field as any).setText(formData.representativeName?.split(' ').slice(1).join(' ') || '');
            }
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N12[0].RDayPhone[0]') {
            if (formData.whoAreYou === "landlord") {
              console.log("✅ Filling LANDLORD PHONE NUMBER");
              (field as any).setText(formData.landlordPhoneNumber || '');
            } else {
              console.log("✅ Filling LEGAL REPRESENTATIVE PHONE NUMBER");
              (field as any).setText(formData.representativePhoneNumber || '');
            }
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N12[0].Signature[0]' && formData.whoAreYou === "landlord") {
            console.log("✅ Filling SIGNATURE");
            console.log("✅ Filling SIGNATURE LANDLORD: ", formData.landlordName, formData.landlordName[0]);
            const signature = `${formData.landlordName[0]} ${formData.landlordName?.split(' ').slice(1).join(' ')[0] || ""}`;
            (field as any).setText(signature || '');
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N12[0].Signature[0]' && formData.whoAreYou === "legal") {
            console.log("✅ Filling SIGNATURE");
              console.log("✅ Filling SIGNATURE LEGAL REPRESENTATIVE: ", formData.representativeName, formData.representativeName[0]);
              const signature = `${formData.representativeName[0]} ${formData.representativeName?.split(' ').slice(1).join(' ')[0] || ""}`;
              (field as any).setText(signature || '');
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N12[0].SignDate[0]') {
            console.log("✅ Filling SIGNATURE DATE");
            (field as any).setText(formData.serveDate || "");
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
      } else if (fieldType === 'radio') {
        try {
          const options = (field as any).getOptions();
          console.log("🔥 RADIO GROUP OPTIONS", options);

          const data = {
            'form1[0].#subform[3].SelectSign[0]': formData.whoAreYou === 'landlord' ? '1' : '2',
            // 'form1[0].#subform[0].Reason1[0]': formData.selectedReasons[0] == 'intend_to_move' ? '1' : '0',
            // 'form1[0].#subform[0].Reason2[0]': formData.selectedReasons[0] == 'purchase_agreement' ? '1' : '0',
          }
          // const radioValue = data[fieldName as keyof typeof data]?.toString() || '1';
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
          //     } catch {}
          //   }
          //   if (!selected) {
          //     console.log(`Could not select radio option for ${fieldName}`);
          //   }
          // }

          if (fieldName.includes('form1[0].#subform[3].SelectSign[0]') && formData.whoAreYou === 'legal') {
            console.log("✅ Filling SIGNATURE");
            (field as any).select('2');
          }

          else if (fieldName.includes('form1[0].#subform[3].SelectSign[0]') && formData.whoAreYou === 'landlord') {
            console.log("✅ Filling SIGNATURE");
            (field as any).select('1');
          }

          else if (fieldName.includes('form1[0].#subform[0].Reason1[0]') && formData.selectedReasons?.includes('intend_to_move')) {
            console.log("checking the condition:", fieldName.includes('form1[0].#subform[0].Reason1[0]') && formData.selectedReasons?.includes('intend_to_move'));
            (field as any).select('1');
          } else if (fieldName.includes('form1[0].#subform[0].Reason2[0]') && formData.selectedReasons?.includes('purchase_agreement')) {
            (field as any).select('1');
          }
          filledCount++;
        } catch (error) {
          console.error(`❌ Error processing radio group ${fieldName}: ${error}`);
        }
      } else if (fieldType === 'checkbox') {
        try {
          // Handle checkboxes for N12 reasons and person selections
          // let shouldCheck = false;

          // Check for main reasons
          // if (formData.selectedReasons?.includes(fieldName)) {
          //   shouldCheck = true;
          // }
          // Check for intended occupant selections
          // else if (formData.intendedOccupant?.includes(fieldName)) {
          //   shouldCheck = true;
          // }
          // Check for care services person selections
          // else if (formData.careServicesPerson?.includes(fieldName)) {
          //   shouldCheck = true;
          // }

          if (fieldName == 'form1[0].#subform[0].Reason1_A1[0]' && formData.intendedOccupant?.includes('me')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_A2[0]' && formData.intendedOccupant?.includes('my_spouse')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_A3[0]' && formData.intendedOccupant?.includes('my_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_A4[0]' && formData.intendedOccupant?.includes('my_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_A5[0]' && formData.intendedOccupant?.includes('my_spouse_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_A6[0]' && formData.intendedOccupant?.includes('my_spouse_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B[0]' && formData.selectedReasons?.includes('intend_to_move') && formData.careServicesPerson && formData.careServicesPerson.length > 0) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B1[0]' && formData.careServicesPerson?.includes('care_me')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B2[0]' && formData.careServicesPerson?.includes('care_my_spouse')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B3[0]' && formData.careServicesPerson?.includes('care_my_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B4[0]' && formData.careServicesPerson?.includes('care_my_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B5[0]' && formData.careServicesPerson?.includes('care_my_spouse_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason1_B6[0]' && formData.careServicesPerson?.includes('care_my_spouse_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_A1[0]' && formData.intendedOccupant?.includes('purchaser')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_A2[0]' && formData.intendedOccupant?.includes('purchaser_spouse')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_A3[0]' && formData.intendedOccupant?.includes('purchaser_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_A4[0]' && formData.intendedOccupant?.includes('purchaser_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_A5[0]' && formData.intendedOccupant?.includes('purchaser_spouse_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_A6[0]' && formData.intendedOccupant?.includes('purchaser_spouse_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B[0]' && formData.selectedReasons?.includes('purchase_agreement') && formData.careServicesPerson && formData.careServicesPerson.length > 0) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B1[0]' && formData.careServicesPerson?.includes('care_purchaser')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B2[0]' && formData.careServicesPerson?.includes('care_purchaser_spouse')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B3[0]' && formData.careServicesPerson?.includes('care_purchaser_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B4[0]' && formData.careServicesPerson?.includes('care_purchaser_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B5[0]' && formData.careServicesPerson?.includes('care_purchaser_spouse_child')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else if (fieldName == 'form1[0].#subform[0].Reason2_B6[0]' && formData.careServicesPerson?.includes('care_purchaser_spouse_parent')) {
            (field as any).check();
            console.log(`✅ CHECKED checkbox: ${fieldName}`);
          } else {
            // (field as any)/.uncheck();
            console.log(`✅ UNCHECKED checkbox: ${fieldName}`);
          }
          filledCount++;
        } catch (error) {
          console.error(`❌ Error processing checkbox ${fieldName}: ${error}`);
        }
      }
    });

    console.log(`=== PROCESSING N12_Acro.pdf ===`);
    console.log(`Total fields found: ${fields.length}`);
    console.log(`Fields filled: ${filledCount}`);

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
        'Content-Disposition': 'attachment; filename="N12.pdf"',
        'Content-Length': filledPdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error filling N12 PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fill N12 PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}