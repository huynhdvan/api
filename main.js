import fetch from "node-fetch";
import XLSX from "xlsx";
import fs from "fs";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const link = "https://api.coinstats.app/public/v1/coins?limit=30";

(async () => {
  try {
    const _getDone  = await getData(link);
    const timetoGet = _getDone[0];
    const jsonData  = _getDone[1];
    const timetoCSV = await saveCSV(jsonData);
    const timetoPNG = await savePNG(jsonData);

    console.log(`Time to complete getData: ${timetoGet} miniseconds`);
    console.log(`Time to complete saveCSV: ${timetoCSV} miniseconds`);
    console.log(`Time to complete savePNG: ${timetoPNG} miniseconds`);
    console.log(`Total: ${timetoGet + timetoCSV + timetoPNG} miniseconds`);
  } catch (err) {
    console.log(err);
  }
})();

async function getData(url) {
  const timeStart = Date.now();
  const req = await fetch(url);
  const getBody = await req.json();
  const data = JSON.parse(JSON.stringify(getBody));
  const timming = Date.now() - timeStart;
  return [timming, data[Object.keys(data)[0]]];
}

function saveCSV(_obj) {
  return new Promise((resolve) => {
    const timeStart = Date.now();
    // convert all Array to String separated by "," character
    _obj.forEach((element) => {
      var arrKey = Object.keys(element);
      arrKey.forEach((el) => {
        if (Array.isArray(element[el])) {
          element[el] = element[el].join(", ");
        }
      });
    });

    let str = XLSX.utils.json_to_sheet(_obj);
    let ostream = XLSX.stream.to_csv(str);
    ostream.pipe(fs.createWriteStream("file.csv"));
    const timming = Date.now() - timeStart;
    resolve(timming);
  });
}

function savePNG(_obj) {
  return new Promise((resolve) => {
    const timeStart = Date.now();
    if (!fs.existsSync("images")) fs.mkdirSync("images");
    _obj.forEach(async (element) => {
      let icon_url = element["icon"];
      let name = element["name"];
      const response = await fetch(icon_url);
      const streamPipeline = promisify(pipeline);
      streamPipeline(response.body, createWriteStream(`images/${name}.png`));
    });
    const timming = Date.now() - timeStart;
    resolve(timming);
  });
}
