"use client";

import React, { useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ICellRendererParams } from "@ag-grid-community/core";
import moment from "moment";
export default function Home() {
  const [numberOfPages, setNumberOfPages] = useState<string>("");
  const [rows, setRows] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const gridApiRef = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleClick = () => {
    if (inputValue !== "") {
      setLoading(true);
      const fetchData = async () => {
        const encodedURI = encodeURIComponent(inputValue);
        const response = await fetch(`/api/scrape?url=${encodedURI}`);
        const data = await response.json();
        setNumberOfPages(data.numberOfPages || "Unknown");
        setRows(data.rows || []);
        setLoading(false);
      };
      fetchData();
      setInputValue("");
      setNumberOfPages("");
      setRows([]);
    }
  };
  useEffect(() => {
    console.log(loading);
  }, [loading]);

  const columnDefs: ColDef[] = [
    {
      headerName: "№",
      field: "index",
      sortable: true,
      filter: false,
      width: 30,
    },
    {
      headerName: "Снимка",
      field: "image",
      cellRenderer: (params: ICellRendererParams) => {
        return <span dangerouslySetInnerHTML={{ __html: params.value }} />;
      },
      autoHeight: true,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
      filter: false,
      suppressMovable: true,
    },
    {
      headerName: "Цена",
      field: "price",
      valueFormatter: (params) =>
        params.value.toLocaleString("en-US", {
          style: "currency",
          currency: "EUR",
        }),
      sortable: true,
      filter: "agNumberColumnFilter",
      width: 110,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
      suppressMovable: true,
      filterParams: {
        applyMiniFilterWhileTyping: true,
        buttons: ["apply", "reset"],
        defaultOption: "inRange",
      },
    },
    {
      headerName: "Тип",
      field: "lnk1",
      cellRenderer: (params: ICellRendererParams) => {
        return <span dangerouslySetInnerHTML={{ __html: params.value }} />;
      },
      width: 90,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
      suppressMovable: true,
      filterParams: {
        applyMiniFilterWhileTyping: true,
        buttons: ["reset"],
      },
    },
    {
      headerName: "Локация",
      field: "lnk2",
      cellRenderer: (params: ICellRendererParams) => {
        return <span dangerouslySetInnerHTML={{ __html: params.value }} />;
      },
      width: 110,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
      suppressMovable: true,
      filterParams: {
        applyMiniFilterWhileTyping: true,
        buttons: ["reset"],
      },
    },
    {
      headerName: "Доп. информация",
      field: "additionalData",
      cellRenderer: (params: ICellRendererParams) => {
        return <span dangerouslySetInnerHTML={{ __html: params.value }} />;
      },
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
      autoHeight: true,
      suppressMovable: true,
      filterParams: {
        applyMiniFilterWhileTyping: true,
        buttons: ["reset"],
      },
    },
    {
      headerName: "Коментари",
      field: "comments",
      editable: true,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
      autoHeight: true,
      cellEditor: "agLargeTextCellEditor",
      suppressMovable: true,
      filter: "agSetColumnFilter",
      filterParams: {
        applyMiniFilterWhileTyping: true,
        buttons: ["reset"],
      },
    },
  ];

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
  };

  const extractUrlFromHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const anchor = doc.querySelector("a");
    return anchor ? anchor.href : "";
  };
  const extractUrlFromImg = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    return img ? img.src : "";
  };

  const extractTextFromHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const anchor = doc.querySelector("a");
    return anchor ? anchor.innerText : "";
  };

  const exportToCsv = () => {
    if (gridApiRef.current) {
      gridApiRef.current.exportDataAsCsv({
        processCellCallback: (params) => {
          if (params.column.getColId() === "image") {
            return extractUrlFromImg(params.value);
          }
          if (params.column.getColId() === "lnk1") {
            return extractTextFromHtml(params.value);
          }
          if (params.column.getColId() === "lnk2") {
            return extractUrlFromHtml(params.value);
          }
          return params.value;
        },
        processHeaderCallback: (params) => {
          if (params.column.getColId() === "lnk1") {
            return "Type";
          }
          return params.column.getColDef().headerName;
        },
        fileName: `${moment().format("DD_MM_YY-HH_mm")}.csv`,
        columnSeparator: ",",
      });
    }
  };

  const onCellValueChanged = (params) => {
    console.log("Cell value changed:", params);

    const { colDef, data, newValue } = params;

    // Update the specific row using applyTransaction()
    gridApiRef.current.applyTransaction({
      update: [{ ...data, [colDef.field]: newValue }],
    });
  };

  return (
    <div style={{ padding: "40px" }}>
      <div
        className='generalInfoContainer'
        style={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <span>Брой страници: {numberOfPages ? numberOfPages : 0}</span>
        <span>Брой записи: {rows.length}</span>
        <div>
          <button
            onClick={exportToCsv}
            style={{
              border: "1px solid white",
              padding: "2px 8px",
              borderRadius: "4px",
              alignSelf: "flex-end",
              fontSize: "0.8rem",
            }}
          >
            CSV
          </button>
        </div>
        <div style={{ display: "flex", marginBottom: "20px" }}>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            placeholder='URL'
            style={{
              borderRadius: "4px",
              marginRight: "10px",
              marginTop: "5px",
              color: "black",
              padding: "5px",
              width: "300px",
            }}
          />
          <button
            onClick={handleClick}
            style={{
              border: "1px solid white",
              padding: "4px 10px",
              borderRadius: "4px",
              alignSelf: "flex-end",
            }}
          >
            {loading ? "Изчакай..." : "Потвърди"}
          </button>
        </div>
      </div>

      <div className='ag-theme-alpine' style={{ height: 400, width: "100%" }}>
        <AgGridReact
          rowData={rows}
          // @ts-expect-error there is an issue with the types, but works OK
          columnDefs={columnDefs}
          domLayout='autoHeight'
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
          }}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          overlayNoRowsTemplate={
            "<span class='custom-loading'>Моля, въведи валиден URL</span>"
          }
        />
      </div>
    </div>
  );
}
