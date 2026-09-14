'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const availablePDFs = [
  { name: 'N4_Acro.pdf', label: 'N4 Notice', apiEndpoint: '/api/fill-n4' },
  { name: 'N5_Acro.pdf', label: 'N5 Notice', apiEndpoint: '/api/fill-n5' },
  { name: 'N8_Acro.pdf', label: 'N8 Notice', apiEndpoint: '/api/fill-n8' },
  { name: 'N12_Acro.pdf', label: 'N12 Notice', apiEndpoint: '/api/fill-n12' }
];

export default function PDFUnifiedTester() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const fillPDF = async (pdfName: string, apiEndpoint: string) => {
    setLoading(pdfName);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfName.replace('.pdf', '')}-filled.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setResults(prev => ({
        ...prev,
        [pdfName]: 'Successfully filled and downloaded!'
      }));
    } catch (error) {
      console.error('Error filling PDF:', error);
      setResults(prev => ({
        ...prev,
        [pdfName]: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    } finally {
      setLoading(null);
    }
  };

  const fillAllPDFs = async () => {
    for (const pdf of availablePDFs) {
      await fillPDF(pdf.name, pdf.apiEndpoint);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>PDF Form Filler - All Forms</CardTitle>
          <CardDescription>
            Fill all 4 PDF forms (N4, N5, N8, N12) with dummy data. Each form will be downloaded automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button 
              onClick={fillAllPDFs} 
              disabled={loading !== null}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Fill All PDFs'}
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePDFs.map((pdf) => (
                <Card key={pdf.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{pdf.label}</h3>
                      <p className="text-sm text-gray-600">{pdf.name}</p>
                      {results[pdf.name] && (
                        <p className={`text-sm mt-2 ${
                          results[pdf.name].includes('Error') ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {results[pdf.name]}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => fillPDF(pdf.name, pdf.apiEndpoint)}
                      disabled={loading !== null}
                      size="sm"
                    >
                      {loading === pdf.name ? 'Filling...' : 'Fill'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
