"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [isLoadingFormId, setIsLoadingFormId] = useState(true);
  const { toast } = useToast();

  const success = searchParams.get("success");
  const urlFormId = searchParams.get("formId");

  useEffect(() => {
    // Get formId from URL params first, then fallback to session storage
    if (urlFormId) {
      setFormId(urlFormId);
      setIsLoadingFormId(false);
    } else {
      const storedFormId = sessionStorage.getItem("formId");
      if (storedFormId) {
        setFormId(storedFormId);
      }
      setIsLoadingFormId(false);
    }
  }, [urlFormId]);

  const handleDownload = async () => {
    if (!formId) {
      toast({
        title: "Error",
        description: "Form information not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Reset states for new download
    setDownloadComplete(false);
    setEmailSent(false);
    setIsDownloading(true);
    try {
      // Get form data from session storage
      const formData = sessionStorage.getItem("formData");
      const storedFormId = sessionStorage.getItem("formId");

      if (!formData) {
        toast({
          title: "Error",
          description: "Form data not found. Please fill out the form again.",
          variant: "destructive",
        });
        return;
      }

      // Validate that the formId matches the stored formId to prevent wrong form download
      if (storedFormId && storedFormId !== formId) {
        toast({
          title: "Form Mismatch",
          description:
            "Form mismatch detected. Please fill out the form again.",
          variant: "destructive",
        });
        return;
      }

      const parsedFormData = JSON.parse(formData);

      // Proof the form fee was paid, verified server-side by the fill route.
      const paidSessionId = sessionStorage.getItem(`ltb:paid:${formId}`);
      if (!paidSessionId) {
        toast({
          title: "Payment not found",
          description:
            "We couldn't confirm your payment. Please start again from the home page.",
          variant: "destructive",
        });
        setIsDownloading(false);
        return;
      }
      parsedFormData.paidSessionId = paidSessionId;

      // Convert tenantNames array to comma-separated string if it exists
      if (
        parsedFormData.tenantNames &&
        Array.isArray(parsedFormData.tenantNames)
      ) {
        parsedFormData.tenantNames = parsedFormData.tenantNames.join(", ");
      }

      // Call the appropriate fill API based on form type
      const response = await fetch(`/api/fill-${formId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedFormData),
      });

      if (response.ok) {
        // Create a blob from the response
        const blob = await response.blob();

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${formId.toUpperCase()}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(url);

        // Mark download as complete and stop loading
        setDownloadComplete(true);
        setIsDownloading(false);

        // Send email with PDF attachment (in background)
        const serviceOption =
          formId === "n4" ? (parsedFormData.serviceOption ?? "") : undefined;
        sendEmailWithPDF(blob, formId, parsedFormData.email, serviceOption);

        // Clear form data from session storage after successful payment
        if (success === "true") {
          // Clear all form data for this form
          sessionStorage.removeItem(`${formId}_formData`);
          sessionStorage.removeItem(`${formId}_currentStep`);

          // Also clear any other form data that might exist
          const formIds = ["n4", "n5", "n8", "n12"];
          formIds.forEach((id) => {
            sessionStorage.removeItem(`${id}_formData`);
            sessionStorage.removeItem(`${id}_currentStep`);
          });

          // One payment, one form: consume the unlock.
          formIds.forEach((id) => sessionStorage.removeItem(`ltb:paid:${id}`));
        }

        // Show success toast immediately after PDF download
        toast({
          title: "Success",
          description: `PDF downloaded successfully and sent to your email!`,
        });

        // Redirect to home page after 5 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error("Error filling PDF:", errorData.error);
        toast({
          title: "Error",
          description: "Error filling PDF: " + errorData.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error calling fill PDF API:", error);
      toast({
        title: "Error",
        description:
          "Error calling fill PDF API: " +
          (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      setIsDownloading(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const sendEmailWithPDF = async (
    pdfBlob: Blob,
    formId: string,
    email: string,
    serviceOption?: "" | "filing" | "representation",
  ) => {
    if (!email) {
      console.log("No email address provided, skipping email send");
      return;
    }

    // Check PDF size (limit to 25MB for email attachments)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (pdfBlob.size > maxSize) {
      console.log("PDF too large for email attachment, skipping email send");
      return;
    }

    console.log(`PDF size: ${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB`);

    setIsSendingEmail(true);
    try {
      // Convert blob to base64 using a more reliable method
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert to base64 using a chunked approach to avoid stack overflow
      let binaryString = "";
      const chunkSize = 8192; // Process in 8KB chunks

      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }

      const base64String = btoa(binaryString);

      // Validate base64 conversion
      console.log(`Base64 length: ${base64String.length} characters`);
      console.log(`Base64 starts with: ${base64String.substring(0, 50)}...`);

      // Test if base64 is valid by trying to decode a small portion
      try {
        atob(base64String.substring(0, 100));
        console.log("Base64 validation: PASSED");
      } catch (error) {
        console.error("Base64 validation: FAILED", error);
        throw new Error("Invalid base64 conversion");
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          formId: formId,
          pdfBuffer: base64String,
          fileName: `${formId.toUpperCase()}.pdf`,
          ...(formId === "n4" && serviceOption ? { serviceOption } : {}),
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        console.log("Email sent successfully");
        return true; // Return true to indicate email was sent successfully
      } else {
        const errorData = await response.json();
        console.error("Error sending email:", errorData.error);
        // Don't show error to user as PDF was already downloaded successfully
        return false;
      }
    } catch (error) {
      console.error("Error sending email:", error);
      // Don't show error to user as PDF was already downloaded successfully
      return false;
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleBackToForm = () => {
    if (formId) {
      router.push(`/${formId}`);
    } else {
      router.push("/");
    }
  };

  // Get form title based on formId
  const getFormTitle = () => {
    switch (formId) {
      case "n4":
        return "Notice to End Tenancy for Non-Payment of Rent (Form N4)";
      case "n5":
        return "Notice to End Tenancy for Interference, Damage, or Overcrowding (Form N5)";
      case "n8":
        return "Notice to End Tenancy at End of Term (Form N8)";
      case "n12":
        return "Notice to End your Tenancy, Because the Landlord, a Purchaser or a Family Member Requires the Rental Unit (Form N12)";
      default:
        return "Download Your Form";
    }
  };

  // Show loading state while formId is being determined
  if (isLoadingFormId) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="">
          <Image
            src="/images/logo.png"
            alt="LTB Logo"
            width={150}
            height={150}
          />
        </div>

        {/* Loading Section */}
        <div className="w-full flex items-center justify-center p-8 flex-1">
          <div className="text-center">
            {/* PDF Icon */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/pdf-icon.png"
                alt="PDF Icon"
                width={96}
                height={76}
              />
            </div>

            {/* Loading Message */}
            <h1 className="text-[30px] font-medium text-gray-800 mb-8">
              Loading...
            </h1>

            {/* Loading Spinner */}
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#C0111F]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success === "false") {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="">
          <Image
            src="/images/logo.png"
            alt="LTB Logo"
            width={150}
            height={150}
          />
        </div>

        {/* Right Section - Error Message */}
        <div className="w-full flex items-center justify-center p-8 flex-1">
          <div className="text-center">
            {/* PDF Icon */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/images/pdf-icon.png"
                alt="PDF Icon"
                width={96}
                height={76}
              />
            </div>

            {/* Error Message */}
            <h1 className="text-[30px] font-medium text-gray-800 mb-8">
              Payment Cancelled
            </h1>

            {/* Return Button */}
            <Button
              onClick={handleBackToForm}
              className="bg-[#C0111F] text-white px-8 py-4 w-[208px] h-[51px] text-sm font-normal rounded-[5px] shadow-lg transition-colors"
            >
              Return to Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success or default case - show download page
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="">
        <Image src="/images/logo.png" alt="LTB Logo" width={150} height={150} />
      </div>

      {/* Right Section - Download Button */}
      <div className="w-full flex items-center justify-center p-8 flex-1">
        <div className="text-center">
          {/* PDF Icon */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/pdf-icon.png"
              alt="PDF Icon"
              width={96}
              height={76}
            />
          </div>

          {/* Form Title */}
          <h1 className="text-[30px] font-medium text-gray-800 mb-8">
            {getFormTitle()}
          </h1>

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-[#C0111F] hover:bg-[#C0111F]/80 text-white px-8 py-4 min-w-[208px] h-[51px] text-sm font-normal rounded-[5px] shadow-lg transition-colors disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
