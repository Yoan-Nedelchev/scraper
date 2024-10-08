import { NextResponse } from "next/server";
import jsdom from "jsdom";
import iconv from "iconv-lite";

const SUBWAY_ARRAY = [
  "младост",
  "дървеница",
  "дианабад",
  "дружба",
  "изгрев",
  "изток",
  "лозенец",
  "хладилника",
  "кръстова",
  "център",
  "зона",
  "разсадника",
  "света троица",
  "люлин",
  "фондови",
  "връбница",
  "надежда",
  "триъгълника",
  "обеля",
  "студентски",
  "сердика",
  "илинден",
  "западен парк",
  "гевгелийски",
  "медицинска академия",
  "красно",
  "овча",
  "хиподрума",
  "лагера",
  "славия",
  "стрелбище",
  "свобода",
  "толстой",
  "хаджи",
  "вазов",
  "яворов",
  "сухата",
  "оборище",
  "подуяне",
  "летище",
  "искър",
  "горна",
  "банишора",
];

export async function GET(req) {
  const resultsTypes = new Set();
  const url = req.nextUrl.searchParams.get("url");

  let counter = 1;
  const lastEqualsIndex = url.lastIndexOf("=");

  async function fetchPage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch the page");

    // Get the response as an ArrayBuffer
    const buffer = await response.arrayBuffer();

    // Convert the buffer from windows-1251 to UTF-8
    const html = iconv.decode(Buffer.from(buffer), "windows-1251");

    // Use jsdom to parse the HTML
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract images
    const imageElements = document.querySelectorAll("a.photoLink img");

    // Extract all elements with class "lnk1" and "lnk2"
    const lnk1Elements = document.querySelectorAll("a.lnk1");
    const lnk2Elements = document.querySelectorAll("a.lnk2");

    // Extract additional data from the <td> elements
    const additionalDataElements = document.querySelectorAll("td[width='520']");

    // Extract prices
    const priceElements = document.querySelectorAll("div.price");

    // Extract the number of pages
    const pageNumbersInfo = document.querySelector(".pageNumbersInfo");
    const numberOfPages = pageNumbersInfo
      ? pageNumbersInfo.textContent?.match(/(\d+)$/)?.[1] || "Unknown"
      : "Unknown";

    Array.from(lnk1Elements).forEach((el) => resultsTypes.add(el.innerHTML));
    const images = Array.from(imageElements).map((el) => el.outerHTML);
    const lnk1Html = Array.from(lnk1Elements).map((el) => {
      el.setAttribute("target", "_blank");
      return el.outerHTML;
    });
    const lnk2Html = Array.from(lnk2Elements).map((el) => {
      el.setAttribute("target", "_blank");
      return el.outerHTML;
    });
    const additionalDataHtml = Array.from(additionalDataElements).map((el) =>
      el.innerHTML.trim()
    );
    const prices = Array.from(priceElements).map(
      (el) => parseFloat(el.textContent.replace(/[^\d.-]/g, "")) || 0
    );

    return {
      images,
      numberOfPages,
      lnk1Html,
      lnk2Html,
      additionalDataHtml,
      prices,
    };
  }

  try {
    const baseUrl = url.substring(0, lastEqualsIndex);
    let currentPage = 1;
    let allData = {
      rows: [],
      numberOfPages: "1",
      resultTypes: [],
    };

    const delay = (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const fetchData = async () => {
      while (true) {
        const pageUrl = `${baseUrl}=${currentPage}`;
        const pageData = await fetchPage(pageUrl);
        const rows = pageData.prices.map((price, index) => ({
          image: pageData.images[index + 2],
          lnk1: pageData.lnk1Html[index],
          lnk2: pageData.lnk2Html[index],
          additionalData: pageData.additionalDataHtml[index],
          price: price,
          subway: SUBWAY_ARRAY.some((subwayItem) =>
            pageData.lnk2Html[index]
              .toLowerCase()
              .includes(subwayItem.toLowerCase())
          )
            ? "да"
            : "провери",
        }));
        allData.rows.push(...rows);
        if (currentPage >= parseInt(pageData.numberOfPages)) break;
        currentPage++;
        await delay(2000);
      }
      allData.rows = allData.rows
        .sort((a, b) => a.price - b.price)
        .map((currentRow) => {
          return { ...currentRow, index: counter++ };
        });
      allData.numberOfPages = currentPage.toString();
      allData.resultTypes = Array.from(resultsTypes);
    };

    await fetchData();
    return NextResponse.json(allData);
  } catch (error) {
    console.error("Error occurred while scraping:", error);
    return NextResponse.json(
      { error: "Failed to fetch the page." },
      { status: 500 }
    );
  }
}
