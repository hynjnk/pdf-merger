import { createSignal, For, Show } from "solid-js";
import { PDFDocument } from "pdf-lib";
import { FileUpload } from "@ark-ui/solid/file-upload";

// Helper function to download a blob
const saveAs = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Home() {
  const [isMerging, setIsMerging] = createSignal<boolean>(false);
  const [fileName, setFileName] = createSignal<string>("merged.pdf");

  const mergePdfs = async (files: File[]) => {
    if (files.length === 0) {
      alert("Please select at least one PDF file.");
      return;
    }

    setIsMerging(true);
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();

      // Process each PDF file
      for (const file of files) {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);

        // Copy all pages from the current PDF
        const copiedPages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices()
        );

        // Add each copied page to the merged PDF
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });

      // Download the merged PDF
      saveAs(blob, fileName());
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Error merging PDFs. Please check the console for details.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <main class="text-center mx-auto text-gray-700 p-4 max-w-3xl">
      <h1 class="text-4xl md:text-6xl text-sky-700 font-thin uppercase my-8 md:my-16">
        PDF Merger
      </h1>

      <div class="mb-6 mt-4">
        <label
          class="block text-gray-700 text-sm font-bold mb-2"
          for="fileName"
        >
          Output filename:
        </label>
        <input
          type="text"
          id="fileName"
          value={fileName()}
          onInput={(e) => setFileName(e.target.value)}
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <FileUpload.Root class="mb-6" maxFiles={5} accept="application/pdf">
        <FileUpload.Label class="block text-gray-700 text-lg font-bold mb-4">
          File Upload
        </FileUpload.Label>
        <FileUpload.Dropzone class="p-6 mb-4 bg-gray-50 rounded">
          Drag your PDF files here
        </FileUpload.Dropzone>
        <FileUpload.Trigger class="px-4 py-2 bg-sky-500 text-white rounded">
          Choose PDF files
        </FileUpload.Trigger>
        <FileUpload.Context>
          {(context) => (
            <>
              <FileUpload.ItemGroup class="mt-4">
                <For each={context().acceptedFiles}>
                  {(file) => (
                    <FileUpload.Item
                      file={file}
                      class="flex items-center justify-between p-2 mb-2 bg-white border rounded"
                    >
                      <div>
                        <FileUpload.ItemName class="font-medium" />
                        <FileUpload.ItemSizeText class="text-sm text-gray-500" />
                      </div>
                      <FileUpload.ItemDeleteTrigger class="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                        ×
                      </FileUpload.ItemDeleteTrigger>
                    </FileUpload.Item>
                  )}
                </For>
              </FileUpload.ItemGroup>
              <button
                onClick={() => mergePdfs(context().acceptedFiles)}
                disabled={isMerging() || context().acceptedFiles.length === 0}
                class={`bg-sky-500 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline ${
                  isMerging() || context().acceptedFiles.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isMerging() ? "Merging..." : "Merge PDFs"}
              </button>
            </>
          )}
        </FileUpload.Context>
        <FileUpload.HiddenInput />
      </FileUpload.Root>
    </main>
  );
}
