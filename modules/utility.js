const RexSearchNumberInsideBracket = new RegExp( /\[\d+\]/g)
const RexSearchMultiPeriods = new RegExp(/\.{2,}/g)
const RexSearchWhitespaces = new RegExp(/\s+/g)
const RexSearchNewLines = new RegExp(/(\r\n|\n|\r)/gm)
const RexSearchAlphaNumeric = new RegExp(/[^a-zA-Z0-9\s]/g)
const RexSearchAlphaNumericAndComa = new RegExp(/[^a-zA-Z0-9 ,]/g)
const RexSearchDateTimeISO =  new RegExp(/DateTime: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g);
const RexSearchNumberingSuffix = new RegExp(/^\d+\.\s*/gm);


export function CleanNumberingSuffix(text="")
{
  return text.replaceAll(RexSearchNumberingSuffix, ""); //remove "321." from string "321. aaa bbb ccc"
}


export function CleanDateTimeISO(text="")
{
  return text.replace(RexSearchDateTimeISO, ""); //remove DateTimeIso from string like this "Lisa:DateTime: 2023-07-24T10:17:19.000Z and other content";
}


export function CleanNumbersInsideBrackets(text="")
{
  return text.replace(RexSearchNumberInsideBracket, ""); //convert "what? [3][123] is life: [1,2,3]" to "what?  is life: [1,2,3]"
}

export function CleanToAlphaNumericAndComaOnly(text="")
{
  return text.replace(RexSearchAlphaNumericAndComa, ""); //convert "what? is life: 1,2,3" to "what is life 1,2,3"
}
export function CleanToAlphaNumericOnly(text="")
{
  return text.replace(RexSearchAlphaNumeric, ""); //convert "what? is life:" to "what is life"
}
export function CombinedParagraphs(text="")
{
  return text.replace(RexSearchNewLines, " "); //combined NEW LINES / PARAGRAPHS into single PARAGRAPH
}
export function CombinedWhitespaces(text="")
{
  return text.replace(RexSearchWhitespaces, " "); //combined multi WHITESPACE into single SPACE
}
export function CombinedPeriods(text="")
{
  return text.replace(RexSearchMultiPeriods, "."); //combined multi PERIOD into single PERIOD
}

export function RemoveWhitespaceItems(array=[""]) {
  return array.filter(item => /\S/.test(item));
}

export function GetTimeStamp()
{
    return Math.floor(Date.now() / 1000)
    //return Date.now()
}

export function GetGUIDV4() {
  var id_str = [];
  var hxDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
     id_str[i] = hxDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  id_str[14] = "4"; // bits 12-15 is for time_hi_and_version field, set to to 0010
  
  id_str[19] = hxDigits.substr((id_str[19] & 0x3) | 0x8, 1); // bits 6-7 for the clock_seq_hi_and_reserved to 01
  
  id_str[8] = id_str[13] = id_str[18] = id_str[23] = "-";
 
  var guid = id_str.join("");
  return guid;
}


export function GetNowUtcString()
{
  return new Date(Date.now()).toISOString();
}

export function GetDateFromTimeStamp(seconds)
{
   return new Date(seconds*1000).toISOString();
}
export function GetLocalDateFromTimeStamp(seconds)
{
   return new Date(seconds*1000).toLocaleString();
}

export function getTimeStampFromDateTime(dateTime)
{
  const dt = Date.parse(dateTime);
  const epoch = Math.floor(dt / 1000);
  return epoch;
}

export function GetTokenCount(text="")
{
  const TOKENS_PERWORD_en = 1.3;
  const curWords = text.split(" ").length;
  const curWordsToks = Math.floor(curWords*TOKENS_PERWORD_en)
  return curWordsToks
}

export async function delay(milliseconds){
	return new Promise(resolve => {
		setTimeout(resolve, milliseconds);
	});
}

export function saveAsFile(filename, data, document) {
  const blob = new Blob([JSON.stringify(data)]);
  const link = document.createElement("a");
  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.click()
};


export function isBase64(str) {
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}

export function isValidBase64(str) {
  return /^[A-Za-z0-9+/]*[=]{0,2}$/.test(str);
}

export function testBase64(str) {
  if (isBase64(str)) {
    console.log(str + " is base64 encoded");
  } else if (isValidBase64(str)) {
    console.log(str + " is valid base64 but not encoded");
  } else {
    console.log(str + " is not base64 encoded");
  }
}


function XorString(str, key) {
  const strArr = Array.from(str);
  const keyArr = Array.from(key);
  let result = "";
  for (let i = 0; i < strArr.length; i++) {
    const xorValue = strArr[i].charCodeAt(0) ^ keyArr[i % keyArr.length].charCodeAt(0);
    result += String.fromCharCode(xorValue);
  }
  return result;
}

export function EncX(s, k) {
  let x1 = XorString(s,k)
  console.log(x1)
  let x2 = btoa(x1)
  console.log(x2)
  return x2
}
export function DecX(s, k) {
  let x1 = atob(s)
  console.log(x1)
  let x2 = XorString(x1, k);
  console.log(x2)
  return x2
}