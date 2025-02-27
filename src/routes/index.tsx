import { createSignal, For, Show } from "solid-js";
import { PDFDocument } from "pdf-lib";

// Helper function to download a blob
const saveAs = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Home() {
  const [pdfFiles, setPdfFiles] = createSignal<File[]>([]);
  const [isMerging, setIsMerging] = createSignal<boolean>(false);
  const [fileName, setFileName] = createSignal<string>("merged.pdf");

  const handlePdfFilesChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const filesArray = Array.from(target.files);
      setPdfFiles(filesArray);
    }
  };

  const removeFile = (index: number) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    setPdfFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const moveFileDown = (index: number) => {
    if (index === pdfFiles().length - 1) return;
    setPdfFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
  };

  const mergePdfs = async () => {
    if (pdfFiles().length === 0) {
      alert("Please select at least one PDF file.");
      return;
    }

    setIsMerging(true);
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each PDF file
      for (const file of pdfFiles()) {
        const fileBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        // Copy all pages from the current PDF
        const copiedPages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices()
        );
        
        // Add each copied page to the merged PDF
        copiedPages.forEach(page => mergedPdf.addPage(page));
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
      
      <div class="mb-6">
        <label class="block text-gray-700 text-lg font-bold mb-4">
          Select multiple PDF files:
        </label>
        <input
          type="file"
          id="pdfFiles"
          accept="application/pdf"
          multiple
          onChange={handlePdfFilesChange}
          class="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <Show when={pdfFiles().length > 0}>
        <div class="mb-6">
          <label class="block text-gray-700 text-lg font-bold mb-2">
            File order (use buttons to reorder):
          </label>
          <div class="bg-gray-100 p-4 rounded">
            <For each={pdfFiles()}>
              {(file, index) => (
                <div class="flex items-center justify-between p-3 mb-2 bg-white rounded shadow">
                  <div class="truncate max-w-xs">{file.name}</div>
                  <div class="flex space-x-2">
                    <button 
                      onClick={() => moveFileUp(index())}
                      disabled={index() === 0}
                      class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveFileDown(index())}
                      disabled={index() === pdfFiles().length - 1}
                      class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                      title="Move Down"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => removeFile(index())}
                      class="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="fileName">
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
      </Show>

      <button
        onClick={mergePdfs}
        disabled={isMerging() || pdfFiles().length === 0}
        class={`bg-sky-500 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline ${
          isMerging() || pdfFiles().length === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isMerging() ? "Merging..." : "Merge PDFs"}
      </button>
    </main>
  );
}
