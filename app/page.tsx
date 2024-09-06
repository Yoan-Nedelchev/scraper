"use client";

import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ICellRendererParams } from "@ag-grid-community/core";
export default function Home() {
  const [numberOfPages, setNumberOfPages] = useState<string>("");
  const [rows, setRows] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleClick = () => {
    const fetchData = async () => {
      const encodedURI = encodeURIComponent(inputValue);
      const response = await fetch(`/api/scrape?url=${encodedURI}`);
      const data = await response.json();
      setNumberOfPages(data.numberOfPages || "Unknown");
      setRows(data.rows || []);
    };
    fetchData();
    setInputValue("");
    setNumberOfPages("");
    setRows([]);
  };

  const columnDefs: ColDef[] = [
    {
      headerName: "№",
      field: "index",
      sortable: true,
      filter: false,
      width: 30,
    },
    {
      headerName: "Изображение",
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
      filterParams: {
        defaultOption: "inRange",
      },
      width: 110,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
    },
    {
      headerName: "Линк 1",
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
    },

    {
      headerName: "Линк 2",
      field: "lnk2",
      cellRenderer: (params: ICellRendererParams) => {
        return <span dangerouslySetInnerHTML={{ __html: params.value }} />;
      },
      width: 100,
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        padding: "10px",
      },
    },
    {
      headerName: "Допълнителна информация",
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
    },
  ];

  return (
    <div style={{ padding: "40px" }}>
      <div
        className='generalInfoContainer'
        style={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <span>Брой страници: {numberOfPages ? numberOfPages : 0}</span>
        <span>Брой записи: {rows.length}</span>
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
            Потвърди
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
        />
      </div>
    </div>
  );
}
