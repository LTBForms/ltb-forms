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
    console.log('Received form data:', formData);

    // Load the N5 PDF
    const pdfPath = path.join(process.cwd(), 'public', 'templates', 'N5_Acro.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    let filledCount = 0;

    fields.forEach(field => {
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


          // Damage amount field
          else if (fieldName.includes('form1[0].#subform[0].Reason2[0]') && formData.damageAmount) {
            console.log("✅ Filling DAMAGE AMOUNT field");
            const amount = parseFloat(formData.damageAmount) || 0;
            (field as any).setText(amount.toFixed(2).padStart(9, ' '));
          }

          // People count field
          else if (fieldName.includes('form1[0].#subform[0].PayMe1[0]') && formData.reasonForNotice === 'damage' && formData.damageType === 'repair' && formData.correctionPeriod === '7days') {
            console.log("✅ Filling PEOPLE COUNT field");
            const amount = parseFloat(formData.damageAmount) || 0;
            (field as any).setText(amount.toFixed(2).padStart(9, ' '));
          }
          else if (fieldName.includes('form1[0].#subform[3].PayMe2[0]') && formData.reasonForNotice === 'damage' && formData.damageType === 'replace' && formData.correctionPeriod === '7days') {
            console.log("✅ Filling PEOPLE COUNT field");
            const amount = parseFloat(formData.damageAmount) || 0;
            (field as any).setText(amount.toFixed(2).padStart(9, ' '));
          }
          else if (fieldName.includes('form1[0].#subform[3].Reason3Explain[0]') && formData.reasonForNotice === 'overcrowding') {
            console.log("✅ Filling PEOPLE COUNT field");
            (field as any).setText(formData.peopleCount || '');
          }
          // else if(fieldName.includes('PayMe2') && formData.peopleCount) {
          //   console.log("✅ Filling PEOPLE COUNT field");
          //   (field as any).setText(formData.peopleCount || '');
          // }

          // Awareness date field
          else if (fieldName.includes('AwarenessDate') || fieldName.includes('awareness')) {
            console.log("✅ Filling AWARENESS DATE field");
            (field as any).setText(formatDateToDDMMYYYY(formData.awarenessDate || ''));
          }

          // Incident details field
          else if (fieldName.includes('IncidentDetails') || fieldName.includes('details')) {
            console.log("✅ Filling INCIDENT DETAILS field");
            (field as any).setText(formData.incidentDetails || '');
          }

          else if (fieldName == 'form1[0].#subform[3].Details_of_the_Events[0].Table2[0].Row1[0].EventDateTime1[0]') {
            console.log("✅ Filling EVENT 1 DATE TIME");
            (field as any).setText(formData.awarenessDate || '');
          } else if (fieldName == 'form1[0].#subform[3].Details_of_the_Events[0].Table2[0].Row1[0].Event1[0]') {
            console.log("✅ Filling EVENT 1 Details");
            (field as any).setText(formData.incidentDetails || '');
          }

          // Signature fields
          else if (fieldName == 'form1[0].#subform[5].Signature_for_Notice[0].RFirstName[0]') {
            if (formData.whoAreYou === 'landlord') {
              console.log("✅ Filling FIRST NAME");
              (field as any).setText(formData.landlordName?.split(' ')[0] || '');
            }
          } else if (fieldName == 'form1[0].#subform[5].Signature_for_Notice[0].RLastName[0]') {
            if (formData.whoAreYou === 'landlord') {
              console.log("✅ Filling LAST NAME");
              (field as any).setText(formData.landlordName?.split(' ').slice(1).join(' ') || '');
            }
          } else if (fieldName == 'form1[0].#subform[5].Signature_for_Notice[0].RDayPhone[0]') {
            console.log("✅ Filling PHONE NUMBER");
            (field as any).setText(formData.landlordPhoneNumber || '');
          } else if (fieldName == 'form1[0].#subform[3].Signature_for_Notice_N5[0].Signature[0]') {
            console.log("✅ Filling SIGNATURE");
            (field as any).setText(formData.name || formData.landlordName || 'Signature');
          } else if (fieldName == 'form1[0].#subform[5].Signature_for_Notice_N5[0].SignDate[0]') {
            console.log("✅ Filling SIGNATURE DATE");
            (field as any).setText(formatDateToDDMMYYYY(formData.serveDate || ""));
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentName[0]') {
            console.log("✅ Filling AGENT NAME");
            (field as any).setText(formData.representativeName || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentLSUC[0]') {
            console.log("✅ Filling AGENT LSUC");
            (field as any).setText(formData.lsucNumber || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentCompany[0]') {
            console.log("✅ Filling AGENT COMPANY");
            (field as any).setText(formData.companyName || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentAddress[0]') {
            console.log("✅ Filling AGENT ADDRESS");
            (field as any).setText(formData.mailingAddress || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentPhoneNum[0]') {
            console.log("✅ Filling REPRESENTATIVE PHONE NUMBER");
            (field as any).setText(formData.representativePhoneNumber || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentMunicipality[0]') {
            console.log("✅ Filling AGENT MUNICIPALITY");
            (field as any).setText(formData.municipality || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentProvince[0]') {
            console.log("✅ Filling AGENT PROVINCE");
            (field as any).setText(formData.province || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentPostCode[0]') {
            console.log("✅ Filling AGENT POST CODE");
            (field as any).setText(formData.postalCode || '');
          } else if (fieldName == 'form1[0].#subform[5].Agent_Information_for_Notice[0].AgentFaxNum[0]') {
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
        // }
        // if(fieldType === "PDFCheckBox") {
        // Reason for notice fields
      } else if (fieldType === 'radio') {
        //   const options = (field as any).getOptions();
        //   console.log("🔥 RADIO GROUP OPTIONS", options);
        //         // const data = {
        //         //   'form1[0].#subform[5].SelectSign[0]': formData.whoAreYou === 'legal' ? '2' : '1',
        //         //   'form1[0].#subform[0].Reason1_1[0]': (formData.reasonForNotice === 'interference' && formData.correctionPeriod === '7days') ? '1' : '0',
        //         //   'form1[0].#subform[0].Reason2_1[0]': (formData.reasonForNotice === 'damage' && (formData.damageType === 'repair'  || formData.damageType === 'replace') && formData.correctionPeriod === '7days') ? '1' : '0',
        //         //   'form1[0].#subform[3].Reason3_1[0]': (formData.reasonForNotice === 'overcrowding' && formData.correctionPeriod === '7days') ? '1' : '0',
        //         // }
        //         // const radioValue = data[fieldName as keyof typeof data]?.toString();
        //         // if (radioValue) {
        //         //   try {
        //         //     const options = (field as any).getOptions();
        //         //     console.log("🔥 RADIO GROUP OPTIONS", options);
        //         //     if (options && options.length > 0) {
        //         //       const optionToSelect = options.find((opt: string) => opt.toLowerCase().includes(radioValue.toLowerCase())) || options[0];
        //         //       console.log("✅ Filling RADIO GROUP", optionToSelect);
        //         //       (field as any).select(optionToSelect);
        //         //     } else {
        //         //       (field as any).select(radioValue);
        //         //     }
        //         //   } catch (e) {
        //         //     const commonValues = [radioValue, radioValue.toUpperCase(), radioValue.toLowerCase(), '1', '0', 'Yes', 'No'];
        //         //     let selected = false;
        //         //     for (const val of commonValues) {
        //         //       try {
        //         //         (field as any).select(val);
        //         //         selected = true;
        //         //         break;
        //         //       } catch {}
        //         //     }
        //         //     if (!selected) {
        //         //       console.log(`Could not select radio option for ${fieldName}`);
        //         //     }
        //         //   }


        //         // }
        //       }
        if (fieldName == 'form1[0].#subform[5].SelectSign[0]' && formData.whoAreYou === 'landlord') {
          console.log("✅ Filling DAMAGE REASON checkbox");
          (field as any).select('1');
        } else if (fieldName == 'form1[0].#subform[5].SelectSign[0]' && formData.whoAreYou === 'legal') {
          console.log("✅ Filling DAMAGE REASON checkbox");
          (field as any).select('2');
        } else if (fieldName == 'form1[0].#subform[0].Reason1_1[0]' && formData.reasonForNotice === 'interference' && formData.correctionPeriod === '7days') {
          console.log("✅ Filling INTERFERENCE REASON checkbox");
          (field as any).select('1');
        } else if (fieldName == 'form1[0].#subform[0].Reason2_1[0]' && formData.reasonForNotice === 'damage' && formData.damageType === 'repair' && formData.correctionPeriod === '7days') {
          console.log("✅ Filling DAMAGE REASON checkbox");
          (field as any).select('1');
        } else if (fieldName == 'form1[0].#subform[0].Reason2_1[0]' && formData.reasonForNotice === 'damage' && formData.damageType === 'replace' && formData.correctionPeriod === '7days') {
          console.log("✅ Filling DAMAGE REASON checkbox");
          (field as any).select('1');
        } else if (fieldName == 'form1[0].#subform[0].Reason2_1[0]') { } else if (fieldName == 'form1[0].#subform[3].Reason3_1[0]' && formData.reasonForNotice === 'overcrowding' && formData.correctionPeriod === '7days') {
          console.log("✅ Filling OVERCROWDING REASON checkbox");
          (field as any).select('1');
        } else if (fieldName == 'form1[0].#subform[0].Reason1_1[0]' && formData.reasonForNotice === 'interference' && formData.correctionPeriod === 'immediate') {
          console.log("✅ Filling INTERFERENCE REASON checkbox");
          (field as any).select('2');
        } else if (fieldName == 'form1[0].#subform[3].Reason2_2[0]' && formData.reasonForNotice === 'damage' && formData.correctionPeriod === 'immediate') {
          console.log("✅ Filling DAMAGE REASON checkbox");
          (field as any).select('1');
        } else if (fieldName == 'form1[0].#subform[3].Reason3_2[0]' && formData.reasonForNotice === 'overcrowding' && formData.correctionPeriod === 'immediate') {
          console.log("✅ Filling OVERCROWDING REASON checkbox");
          (field as any).select('1');
        }
        filledCount++;
      } else if (fieldType === 'checkbox') {
        if (fieldName.includes('form1[0].#subform[0].Reason1[0]') && formData.reasonForNotice === 'interference') {
          console.log("✅ Filling INTERFERENCE REASON checkbox");
          (field as any).check();
        } else if (fieldName.includes('form1[0].#subform[0].Reason2[0]') && formData.reasonForNotice === 'damage') {
          console.log("✅ Filling DAMAGE REASON checkbox");
          (field as any).check();
        } else if (fieldName.includes('form1[0].#subform[3].Reason3[0]') && formData.reasonForNotice === 'overcrowding') {
          console.log("✅ Filling OVERCROWDING REASON checkbox");
          (field as any).check();
        }
        filledCount++;
      }
    });

    console.log(`=== FILLING SUMMARY FOR N5 ===`);
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
        'Content-Disposition': 'attachment; filename="N5.pdf"',
        'Content-Length': filledPdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error filling N5 PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fill N5 PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
