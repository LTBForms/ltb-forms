import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the N4.pdf file
    const pdfPath = path.join(process.cwd(), 'public', 'templates', 'N12_Acro.pdf');
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: 'PDF file not found' },
        { status: 404 }
      );
    }

    // Read the PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get all form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    // Extract field information
    const fieldData = fields.map(field => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      // Get field value if possible
      let fieldValue = '';
      try {
        if (fieldType === 'PDFTextField') {
          fieldValue = (field as any).getText();
        } else if (fieldType === 'PDFCheckBox') {
          fieldValue = (field as any).isChecked() ? 'checked' : 'unchecked';
        } else if (fieldType === 'PDFRadioGroup') {
          fieldValue = (field as any).getSelected()?.toString() || '';
        } else if (fieldType === 'PDFDropdown') {
          fieldValue = (field as any).getSelected()?.toString() || '';
        }
      } catch (error) {
        fieldValue = 'Error reading value';
      }
      
      return {
        name: fieldName,
        type: fieldType,
        value: fieldValue
      };
    });

    // Console log all field keys and details
    console.log('=== PDF Form Fields Extraction ===');
    console.log(`Total fields found: ${fieldData.length}`);
    console.log('Field details:');
    fieldData.forEach((field, index) => {
      console.log(`${index + 1}. Field Name: "${field.name}"`);
      console.log(`   Type: ${field.type}`);
      console.log(`   Value: "${field.value}"`);
      console.log('---');
    });
    
    // Also log just the field names/keys
    console.log('=== Field Keys Only ===');
    const fieldKeys = fieldData.map(field => field.name);
    console.log('Field keys:', fieldKeys);
    console.log('Field keys (JSON):', JSON.stringify(fieldKeys, null, 2));

    return NextResponse.json({
      success: true,
      totalFields: fieldData.length,
      fields: fieldData,
      fieldKeys: fieldKeys
    });

  } catch (error) {
    console.error('Error extracting PDF fields:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract PDF fields',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
