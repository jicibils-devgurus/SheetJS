import { useState } from "react";
import XLSX from "xlsx";
import useFetch from "use-http";

import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [cols, setCols] = useState([]);
  const [worksheet, setWorksheet] = useState(null);
  const [exelFile, setExelFile] = useState(null);
  const [sheetToHtml, setSheetToHtml] = useState(null);

  const baseApiUrl = "http://localhost:8080";
  const { post } = useFetch(baseApiUrl);

  const handleFile = (file) => {
    setExelFile(file);
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;
    reader.onload = (e) => {
      /* Parse data */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: rABS ? "binary" : "array" });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      setWorksheet(ws);
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      /* Update state */
      setData(data);
      setCols(make_cols(ws["!ref"]));
    };
    if (rABS) reader.readAsBinaryString(file);
    else reader.readAsArrayBuffer(file);
  };

  const exportFile = () => {
    /* convert state to workbook */
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
    /* generate XLSX file and send to client */
    XLSX.writeFile(wb, "sheetjs.xlsx");
  };

  const convertToJSON = () => {
    const json = XLSX.utils.sheet_to_json(worksheet);
    console.log("🚀 JSON: ", json);
  };
  const convertToArray = () => {
    const array = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("🚀 ARRAY: ", array);
  };

  const convertToCSV = () => {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    console.log("🚀 CSV: ", csv);
  };

  const convertToText = () => {
    const txt = XLSX.utils.sheet_to_txt(worksheet);
    console.log("🚀 TEXT: ", txt);
  };

  const convertToHtml = () => {
    const html = XLSX.utils.sheet_to_html(worksheet);
    console.log("🚀 HTML: ", html);
    setSheetToHtml(html);
  };

  const sendWsToNode = async () => {
    const data = new FormData();
    data.append("file", exelFile);

    await post("/", data);
    console.log("SENT");
  };

  return (
    <div className="App">
      <DragDropFile handleFile={handleFile}>
        <div className="App-header">
          <div>
            <div>
              <DataInput handleFile={handleFile} />
            </div>
          </div>
          <div>
            <div>
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={exportFile}
              >
                Export
              </button>{" "}
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={convertToJSON}
              >
                convert to JSON
              </button>{" "}
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={convertToArray}
              >
                convert to ARRAY
              </button>{" "}
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={convertToCSV}
              >
                convert to CSV
              </button>{" "}
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={convertToText}
              >
                convert to TXT
              </button>{" "}
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={convertToHtml}
              >
                convert to HTML
              </button>{" "}
              <button
                disabled={!data.length}
                className="btn btn-success"
                onClick={sendWsToNode}
              >
                Send to NODE
              </button>{" "}
            </div>
          </div>
        </div>
      </DragDropFile>
      <div>
        <div>
          <OutTable data={data} cols={cols} />
        </div>
      </div>
      {!!sheetToHtml && (
        <div className="ext-table">
          <div
            dangerouslySetInnerHTML={{
              __html: `${sheetToHtml}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;

function DragDropFile({ handleFile, children }) {
  const suppress = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  return (
    <div onDrop={handleDrop} onDragEnter={suppress} onDragOver={suppress}>
      {children}
    </div>
  );
}

function DataInput({ handleFile }) {
  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) handleFile(files[0]);
  };

  return (
    <form className="form-inline">
      <div className="form-group">
        <label htmlFor="file">Drag or choose a spreadsheet file</label>
        <br />
        <input
          type="file"
          className="form-control"
          id="file"
          accept={SheetJSFT}
          onChange={handleChange}
        />
      </div>
    </form>
  );
}

function OutTable({ data, cols }) {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key}>{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c.key}>{r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* list of supported file types */
const SheetJSFT = [
  "xlsx",
  "xlsb",
  "xlsm",
  "xls",
  "xml",
  "csv",
  "txt",
  "ods",
  "fods",
  "uos",
  "sylk",
  "dif",
  "dbf",
  "prn",
  "qpw",
  "123",
  "wb*",
  "wq*",
  "html",
  "htm",
]
  .map((x) => `.${x}`)
  .join(",");

/* generate an array of column objects */
const make_cols = (refstr) => {
  let o = [],
    C = XLSX.utils.decode_range(refstr).e.c + 1;
  for (var i = 0; i < C; ++i) o[i] = { name: XLSX.utils.encode_col(i), key: i };
  return o;
};
