import * as call_ai from "../../modules/call_ai.js"
import * as idb from "../../modules/IndexDB.js"
import * as util from '../../modules/utility.js';
import * as klenik from '../../modules/Klenik.js';
import * as math from '../../modules/math.js'
import {
  VectorDB
}
from "../../modules/VectorDB.js";
import {
  ConversationDB
}
from "../../modules/ConversationDB.js";
import * as userIntents from "./user_intents.js";

const version = "v.002"
const dbName = "ynbt-lite-AI_Agent-Sofia";
idb.SetDBName(dbName)
const vectorDB = new VectorDB();
const conversationDB = new ConversationDB();

//<!-- DATA -->
const textChunker = {
  "dataType": "textchunker",
  "chunk_size": 200,
  "chunk_overlap": 5,
};

const _SYS_INPUT_PERSON_DATA_ = "_SYS_INPUT_PERSON_DATA_";
const _INTENT_UNKNOWN_ = "UNKNOWN";

const _P_DECODE_USER_INTENT_=
`===USER_INTENT
- Ask about romance
- Ask about a day
- Ask about a good day
- Ask about date and time
- Ask about person character
- Stating a person name and birthday
- Unknown

===USER_QUERY
_USER_MSG_

===INSTRUCTION
Map USER_QUERY to an item in USER_INTENT:
`
const _P_EXTRACT_PERSONAL_INFORMATION_1=
`===USER_QUERY
_USER_MSG_

===INSTRUCTION
extract personal information from USER_QUERY as a JSON with fields:name,birthday,relation. Date fields always in "yyyy-mm-dd" format.Write relation in Indonesian.`

const _P_EXTRACT_PERSONAL_INFORMATION_=
`===USER_QUERY
_USER_MSG_

===INSTRUCTION
extract personal information from USER_QUERY as a JSON with fields:name,birthday,relation_to_user. Date format is "yyyy-mm-dd".Relation available:Self,Istri,Suami,Pacar,Tunangan,Atasan,Bos,Teman,Anak,Saudara,Unknown.`



const _P_EXTRACT_DATE_QUERY_=
`===USER_QUERY
Today is _TODAY_DATE_
_USER_MSG_

===INSTRUCTION
Check if USER_QUERY represents a single date or a date range. Extract date information for a single date or calculate the date range. Output the result in JSON format with fields: day_count, date_start, date_end. Date fields are in "yyyy-mm-dd" format.
`
const _P_GENERATE_QUESTIONS_FROM_DATA_1=
`===DATA
_DATA_

===INSTRUCTION
Write _COUNT_ concise Indonesian questions derived from psychological, human relations, and behavioral data, as a JSON list:
`
const _P_GENERATE_QUESTIONS_FROM_DATA_=
`===DATA
_DATA_

===INSTRUCTION
Write _COUNT_ very short Indonesian questions derived from psychological, human relations, and behavioral data, as a JSON list:
`

const _P_GENERATE_QUESTIONS_FROM_QUESTION_=
`===QUESTION
_QUESTION_

===INSTRUCTION
Write _COUNT_ concise Indonesian similar questions, as a JSON list:
`

const _P_TRANSLATE_TO_ENGLISH_=
`translate the text below to english:
_USER_MSG_
`

var persona = {
  "dataType": "persona",
  "persona_greetings": "Namaku adalah Sofia<br><br>Aku adalah seorang penasehat spritual, yang sangat ahli mengenai numerologi Primbon Jawa dan Jalur Hidup<br><br>Berdasarkan hari kelahiran seseorang, Aku dapat memberikan nasehat mengenai sifat-sifat dan kehidupan engkau dan orang lain disekitarmu.",
  "persona_context":"",
  
  "persona_info":"Saya adalah Dewi Sofia, pemberi nasehat bijaksana dengan keahlian dalam psikologi, bisnis, dan percintaan. Saya selalu memulai dengan 'Wahai Anaku' untuk jawaban singkat yang bermakna.",

  "persona_name": "Sofia",

  "user_name": "User",
  "user_personalData":{
    fullName: "",
    firstName: "",
    birthday: "",
    birthdayDetail: []
  },

  "tb_oai_key": "CgVPRxohBTsgWw84KhEuLh8zdx8GFRE1SiwOFkYqIx0gQnYRFiweUzpEVWslLV8PEBga",
  "inf_temperature": "0.9",
  "inf_maxgen": 512
};

var conversation = {
  "dataType": "conversation",
  "references": [
    "First conversation"
  ],
  "textChunks": [{
      "id": "85d192b3-a956-498b-81ef-32ae82a4fba6",
      "timestamp": 1687228394,
      "title": "Opening",
      "keyConcepts": [""],
      "text": "User:Wahai Sofia, bantulah aku!<|D|>Sofia:Wahai Anakku, perkenalkan dirimu kepadaku!",
      "text__": "User:Oh Sofia, goddess of darkness, hear my cry!<|D|>Sofia:Dear Child, please introduce yourself to me...",
      "vectors": [0, 0, 0]
    }
  ]
};

var knowledgebase = {
  "dataType": "knowledgebase",
  "references": [
    "General Knowledge"
  ],
  "textChunks": [{
      "id": "85d192b3-a956-498b-81ef-32ae82a4fba6",
      "timestamp": 1687228394,
      "title": "General Knowledge",
      "keyConcepts": [""],
      "text": "The current year is 2023",
      "vectors": [0, 0, 0]
    }
  ]
};

//<!-- FUNCTIONS -->
const docById = (id) => document.getElementById(id);
const docByClass = (className) => document.getElementsByClassName(className);

async function log_out()
{
  await idb.DeleteIDB(); //CLEAR
  window.location.reload(true);
}

async function userIntentGetVectors()
{
  for (const item of userIntents.data) {
    if(item.tag!="" && item.template!="" && item.vectors.length==0)
    {
      //item.vectors = await vectorDB.GetSentenceVectors(item.tag);
      item.vectors = await vectorDB.GetSentenceVectors(item.template);
      console.log(item);
    }
    
  }
  
}

async function userIntentDecodeWithVectors(userMsg)
{
  const userMsgVec2 = await vectorDB.GetSentenceVectors(userMsg);
  let simTest = [];
  for (const item of userIntents.data) {
    const vv = math.SimilarityVector(userMsgVec2, item.vectors);
    //const vj = math.DistanceLevenshtein(userMsg,item.tag)
    //const vj = math.SimilarityJaccard(userMsg,item.tag)
    const vj = 0;
    simTest.push({tag:item.tag, val:vv+vj})
  }

  //SORT HIGH similarity first
  simTest.sort(function (a, b) {
    return b.val - a.val;
  });

  console.log(userMsg);
  console.log(simTest[0]);

  return simTest[0].tag;
}

async function userIntentDecodeWithLLM(userMsg)
{
  docById('dlg_info_title').textContent="... Thinking ...";
  docById('dlg_info').showModal();

  let p = _P_DECODE_USER_INTENT_.replace("_USER_MSG_", userMsg)
  var rsp = await call_ai.call_oai_completion_stream("",p, vectorDB.oaiKey,null,0.0,64);
  console.log(`${userMsg} --> ${rsp}`);
  
  docById('dlg_info').close('');

  return rsp;
}

async function kbUpdateProfileSelf(rspJSON, dayDetail, profilingResult)
{
  persona.user_personalData.fullName = rspJSON.name;
  persona.user_personalData.firstName = rspJSON.name.split(' ')[0];
  persona.user_personalData.birthday = rspJSON.birthday;
  persona.user_personalData.birthdayDetail = dayDetail;
  persona.user_name = persona.user_personalData.firstName;
  const kbTitle = `Profile Psikologi ${rspJSON.name}`
  const kbContent = profilingResult
  await vectorDB.DeleteTitle(VectorDB.DATA_TYPE_KB,kbTitle) //delete old data
  await vectorDB.IntegrateText(kbTitle, "", kbContent, false, 512, 0);
  await kbGetTitles();

  const final_userMsg = `Nama lengkap saya: ${rspJSON.name}\nHari kelahiran saya: ${rspJSON.birthday}\nJelaskan karakter saya dari semua sisi`
  return final_userMsg;
}
async function kbUpdateProfileOther(rspJSON, dayDetail, profilingResult)
{
  const relationTypeRomance=["istri","suami","pacar","tunangan"];
  const relationTypeBusiness=["bos","partner bisnis"];
  const relToUser = rspJSON.relation_to_user.toLowerCase();
  let userDayDetail = persona.user_personalData.birthdayDetail;
  let userPersonalData = persona.user_personalData;
    
  const kbTitle = `Profile Psikologi ${rspJSON.name}`
  const kbContent = `${profilingResult}Hubungan dengan User: ${relToUser}`
  await vectorDB.DeleteTitle(VectorDB.DATA_TYPE_KB,kbTitle) //delete old data
  await vectorDB.IntegrateText(kbTitle, "", kbContent, false, 512, 0);
  await kbGetTitles();
  console.log(kbContent);

  if(relationTypeRomance.includes(relToUser))
  {
    let perjodohan = klenik.PrimbonGetPerJodohanHariLahir(
    [userDayDetail[1], userDayDetail[3]], 
    [dayDetail[1], dayDetail[3]]);
  
    const kbTitle = `Profile Perjodohan Primbon antara ${userPersonalData.fullName} dengan ${rspJSON.name}`
    await vectorDB.DeleteTitle(VectorDB.DATA_TYPE_KB,kbTitle) //delete old data
  
    const kbContent = 
    `[${kbTitle}]\nNama Perjodohan: ${perjodohan.Nama}\nPrediksi Perjodohan: ${perjodohan.Prediksi}`;

    await vectorDB.IntegrateText(kbTitle, "", kbContent, false, 512, 0);
    await kbGetTitles();
  }
        
  //const final_userMsg = `Nama lengkap ${relToUser} saya: ${rspJSON.name}\nHari kelahiran ${relToUser} saya: ${rspJSON.birthday}\nJelaskan karakter orang ini dari semua sisi`;
  const final_userMsg = `Nama lengkap ${relToUser} saya: ${rspJSON.name}\nHari kelahiran ${relToUser} saya: ${rspJSON.birthday}\nBuat 3 pertanyaan singkat yg relevan mengenai orang ini.`;
  return final_userMsg;
}

var Intent_Decode_Result = {
  intent: "UNKNOWN",
  final_userMsg: "",
  final_botMsg: "",
  sendToAI: true
}
async function userIntentDecode(userMsg)
{
  /*
  - Ask about romance
  - Ask about a day
  - Ask about a good day
  - Ask about date and time
  - Ask about person character
  - Stating the user name and birthday
  - Stating other person name and birthday
  - Unknown
  */
  //const userIntentTag = await userIntent_decode_with_vectors(userMsg) 

  const p_translate = _P_TRANSLATE_TO_ENGLISH_.replace('_USER_MSG_',userMsg);
  //var userMsg_en = await call_ai.call_oai_completion_stream("",p_translate, vectorDB.oaiKey,null,0.0,64);
  //console.log(userMsg_en)
  const userIntentTag = await userIntentDecodeWithLLM(userMsg);
  //await util.delay(1000)

  Intent_Decode_Result.final_userMsg = userMsg;
  let foundIntent = "Stating a person name and birthday";
  Intent_Decode_Result.intent = foundIntent;
  if(userIntentTag.includes(foundIntent))
  {
    let p = _P_EXTRACT_PERSONAL_INFORMATION_.replace("_USER_MSG_", userMsg)
    var rsp = await call_ai.call_oai_completion_stream("",p, vectorDB.oaiKey,null,0.0,64);
    await util.delay(1000)
    var rspJSON = JSON.parse(rsp);
    console.log(rspJSON)

    const birthdayArr = rspJSON.birthday.split('-');
    var { dateBirthStr, dayDetail, result } = generatePeopleProfile(birthdayArr[0],birthdayArr[1],birthdayArr[2],rspJSON.name)


    const relToUser = rspJSON.relation_to_user.toLowerCase();
    if(relToUser=="self")
    {
      Intent_Decode_Result.final_userMsg = await kbUpdateProfileSelf(rspJSON, dayDetail, result);
      Intent_Decode_Result.sendToAI = true;
      return Intent_Decode_Result;
    }
    else
    {
      Intent_Decode_Result.final_userMsg = await kbUpdateProfileOther(rspJSON, dayDetail, result)
      Intent_Decode_Result.sendToAI = true;
      return Intent_Decode_Result;
    }
    
  }

  foundIntent = "Ask about a good day";
  Intent_Decode_Result.intent = foundIntent;
  if(userIntentTag.includes(foundIntent))
  {
    const curDate = new Date(Date.now())
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = curDate.toLocaleDateString('id-ID', options)
    let p = _P_EXTRACT_DATE_QUERY_
            .replace('_TODAY_DATE_', today)
            .replace('_USER_MSG_', userMsg);

    console.log(p) 
    var rsp = await call_ai.call_oai_completion_stream("",p, vectorDB.oaiKey,null,0,128);
    await util.delay(1000)
    try 
    {
      var rspJSON = JSON.parse(rsp);
      console.log(rspJSON);
      const userBirthday = new Date(persona.user_personalData.birthday);
      const bussinessDay = new Date(rspJSON.date_start);
      const dayCount  = rspJSON.day_count;
      var daysPredictions = klenik.PrimbonGetHariBisnis(userBirthday, bussinessDay, false, dayCount);
      let final_botMsg = `Wahai Anaku, menurut perhitungan wetonmu dan weton hari:\n`;
      for (const hariPredict of daysPredictions) {
        final_botMsg +=`Tanggal ${hariPredict.predictHari}, hari ${hariPredict.namaHari}\nberkarakter:${hariPredict.karakterHari}\nbertuah:${hariPredict.pancasona}\n\n`;
      }
      console.log(final_botMsg);
      Intent_Decode_Result.sendToAI = false;
      Intent_Decode_Result.final_botMsg = final_botMsg;
      return Intent_Decode_Result;
    } 
    catch (error) 
    {
      console.log(`Error: ${rsp}`) 
      console.log(error)
    }

  }
  

  //I dont know !!
  Intent_Decode_Result.intent = _INTENT_UNKNOWN_;
  Intent_Decode_Result.sendToAI = true;
  return Intent_Decode_Result;
}


async function getRelatedQuestionFromPersonProfile(personProfile="")
{
  const p = _P_GENERATE_QUESTIONS_FROM_DATA_.replace('_DATA_', personProfile);
  const rsp = await call_ai.call_oai_completion_stream("",p, vectorDB.oaiKey,null,0.0,128);
  await util.delay(1000)
  const rspJSON = JSON.parse(rsp);
  let retVal = `Pertanyaan lebih lanjut:\n`
  for (const item of rspJSON) {
    retVal +=`${item}\n`
  }
  return retVal
}

function open_get_person_data(dataSiapa = "Data Saya") {
  docById('dlg_header_get_person_data').innerHTML = dataSiapa

    if (dataSiapa == "Data Saya") {
      docById('dlg_get_person_data_btn_cancel').style.visibility = 'collapse'
        docById('div_dlg_get_person_data_tb_relation').style.visibility = 'collapse'
        docById('div_dlg_get_person_data_tb_relation').style.height = '0px'
    } else {
      docById('dlg_get_person_data_btn_cancel').style.visibility = 'unset'
        docById('div_dlg_get_person_data_tb_relation').style.visibility = 'unset'
        docById('div_dlg_get_person_data_tb_relation').style.height = 'unset'
    }

    docById('dlg_get_person_data_tb_fullName').value = "";
    dlg_get_person_data.showModal()
}

async function submit_get_person_data() {
  dlg_get_person_data.close('')

  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);

  const fullName = docById('dlg_get_person_data_tb_fullName').value;
  const relation = docById('dlg_get_person_data_tb_relation').value;
  const birthYear = docById('dlg_get_person_data_tn_birthYear').value;
  const birthMonth = docById('dlg_get_person_data_tn_birthMonth').value.padStart(2, '0');
  const birthDate = docById('dlg_get_person_data_tn_birthDate').value.padStart(2, '0');

  if (fullName.length < 3 || birthYear.length  < 4 || birthMonth == "00" || birthDate == "00") {
    alert("Data Invalid!");
    return;
  }

  var { dateBirthStr, dayDetail, result } = generatePeopleProfile(birthYear, birthMonth, birthDate, fullName);

  //console.log(result)
  if (docById('dlg_header_get_person_data').innerHTML == "Data Saya") 
  {
    let rspJSON = {name:fullName,birthday:dateBirthStr, relation_to_user:"Self"}
    const final_userMsg = await kbUpdateProfileSelf(rspJSON,dayDetail, result);
    await msgSend(_SYS_INPUT_PERSON_DATA_ + final_userMsg);
  }


  if (docById('dlg_header_get_person_data').innerHTML == "Data Orang Lain") 
  {
    let rspJSON = {name:fullName,birthday:dateBirthStr, relation_to_user:relation}
    let final_userMsg = await kbUpdateProfileOther(rspJSON, dayDetail, result)
    //final_userMsg = await get_related_question_from_person_profile(result);
    await msgSend(_SYS_INPUT_PERSON_DATA_ + final_userMsg);
  }

  
}

function generatePeopleProfile(birthYear, birthMonth, birthDate, fullName) {
  const dateBirthStr = `${birthYear}-${birthMonth}-${birthDate}`;
  const dateBirth = new Date(dateBirthStr);
  const dayDetail = klenik.PrimbonGetHariPasaran(dateBirth);
  const dayDetailPredictionPrimbon = klenik.PrimbonGetSifatElemenHariLahir(dayDetail[0]);

  let resultPrimbon = `Profile Psikologi Primbon ${fullName}
Neptu Hari: ${dayDetail[0]}-${dayDetail[1]}
Neptu Pasaran: ${dayDetail[2]}-${dayDetail[3]}
Elemen Hari: ${dayDetailPredictionPrimbon.Nama}
Karakter Dasar: ${dayDetailPredictionPrimbon.Karakter}
Kelemahan: ${dayDetailPredictionPrimbon.Kelemahan}`;

  const dayDetailPredictionLifePath = klenik.NumerologyLifePathNumber(dateBirthStr);
  let resultLifePath = `Profile Psikologi Jalur Hidup ${fullName}
Nama Jalur Hidup: ${dayDetailPredictionLifePath[1].Nama}
Karakter Dasar: ${dayDetailPredictionLifePath[1].Sifat}
Kelemahan: ${dayDetailPredictionLifePath[1].Kelemahan}`;

  const dayDetailAgeGroup = klenik.CalculateAgeGroupAndCharacteristics(dateBirthStr);
  let resultAgeGroup = `Profile Psikologi Age Group ${fullName}
Nama Age Group: ${dayDetailAgeGroup.ageGroup}
Karakter Age Group: ${dayDetailAgeGroup.characteristics.join(", ")}
`;
  let result = `[Data Diri ${fullName}]
Hari lahir: ${dayDetail[0]}, ${birthDate} ${dayDetail[4]}, ${birthYear}
${resultPrimbon}
${resultLifePath}
${resultAgeGroup}`;
  return { dateBirthStr, dayDetail, result };
}

function speak(elId = "") {
  const text = docById(elId).textContent;
  console.log(text);
  const utterance = new SpeechSynthesisUtterance(text);

  // Optionally, you can set properties for the utterance
  //utterance.voice = speechSynthesis.getVoices()[91]; // edge:emily
  //utterance.voice = speechSynthesis.getVoices()[170]; // edge:siti
  utterance.voice = speechSynthesis.getVoices()[161]; // edge:gadis
  //utterance.lang = 'en-US';
  utterance.pitch = 0.70;
  utterance.rate = 1;
  utterance.volume = 1.0;

  // Speak the utterance
  speechSynthesis.speak(utterance);
}
function listVoices() {
  const voices = speechSynthesis.getVoices();
  for (let i = 0; i < voices.length; i++) {
    console.log(`Index ${i}: ${voices[i].name}`);
  }

}
// wait on voices to be loaded before fetching list
speechSynthesis.onvoiceschanged = function () {
  //listVoices();
  //speak("Engine On!!");
};

function scrollMessageToBottom() {
  var objDiv = docById('messages');
  objDiv.scrollTop = objDiv.scrollHeight;
}

async function load_user_idb() {
  const u_p = await idb.GetIDBObject("persona");
  if (u_p != null) {
    persona = u_p
  } else {
    await idb.SaveIDBObject(persona)
  }

  const u_c = await idb.GetIDBObject("conversation");
  if (u_c != null) {
    conversation = u_c
    await msgGetHistory();
  } else {
    await idb.SaveIDBObject(conversation)
    await msgGetHistory();
  }

  const u_k = await idb.GetIDBObject("knowledgebase");
  if (u_k != null) {
    await kbGetTitles();
  } else {
    await idb.SaveIDBObject(knowledgebase)
    await kbGetTitles();
  }

}

async function update_user_persona() {
  try {
    await idb.SaveIDBObject(persona);
  } catch {
    alert("Invalid JSON Structure")
  }

}

function render_msg(data) {
  var message = JSON.parse(data);
  const rspMsgId = message.timestamp;

  const msgText = message.text
    .replaceAll("\"", "")
    .replaceAll(`${persona.user_name}:`, "")
    .replaceAll(`${persona.persona_name}:`, "")
    .replaceAll("\n", "<br>");

  let msg =
    `<div class="_MSG_CLASS_">
			<p id="_BOT_RSP_ID_">_MSG_TEXT_</p>
			<span class="_TIME_CLASS_">_TIMESTAMP_</span>
      _BUTTONS_
			</div>`

    /*
    let buttons = `<button id="btnDelete__BOT_RSP_ID_" title="Delete">X</button>
			<button id="btnSpeak__BOT_RSP_ID_" title="Speak" onclick="speak('_BOT_RSP_ID_')">?</button>
      <button id="btnEdit__BOT_RSP_ID_" title="Edit" onclick="msgEdit('_DIALOG_ID_')">=</button>`
    */
    let buttons = `<button id="btnDelete__BOT_RSP_ID_" title="Delete">X</button>`

    msg = msg.replace("_MSG_TEXT_", msgText)
    if (message.from === 'me') {
      msg = msg.replaceAll("_BUTTONS_", "")
        msg = msg.replace("_MSG_CLASS_", `message message-dark`)
        msg = msg.replace("_TIMESTAMP_", util.GetLocalDateFromTimeStamp(message.timestamp))
        msg = msg.replace("_TIME_CLASS_", `time-left`)
        msg = msg.replaceAll("_DIALOG_ID_", message.dialogId)
    } else {
      buttons = buttons.replaceAll("_BOT_RSP_ID_", rspMsgId)
        msg = msg.replaceAll("_BOT_RSP_ID_", rspMsgId)
        msg = msg.replaceAll("_BUTTONS_", buttons)
        msg = msg.replace("_MSG_CLASS_", `message`)
        msg = msg.replace("_TIMESTAMP_", util.GetLocalDateFromTimeStamp(message.timestamp))
        msg = msg.replace("_TIME_CLASS_", `time-right`)
        msg = msg.replaceAll("_DIALOG_ID_", message.dialogId)
    }

  const messagesDiv = document.getElementById('messages');
  //const messageDiv = document.createElement('div');
  messagesDiv.innerHTML += msg;
  scrollMessageToBottom();

  if (message.from !== 'me')
  {
    let btnDelete = "btnDelete__BOT_RSP_ID_".replace('_BOT_RSP_ID_', rspMsgId);
    docById(btnDelete).addEventListener('click', async function () {
      click_delete_dialog(message.dialogId)
    });
  }
  

  return rspMsgId;
};

async function cmd_execute(input="")
{
  if(input=="cmd_kb_edit")
  {
    docById("dlg_kbList").showModal();
    return;
  }
  if(input=="cmd_data_export")
  {
    await exportJSONData();
    return;
  }
  if(input=="cmd_kb_add")
  {
    docById("dlg_kb_input").showModal();
    return;
  }
  if(input=="cmd_logout")
  {
    await log_out();
    return;
  }

}
async function msgSend(input = "") {

  if(input.startsWith("cmd_"))
  {
    await cmd_execute(input);
    return;
  }

  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);

  let final_input = input
  if(!input.startsWith('_SYS_'))
  {
    let decodeResult = await userIntentDecode(input);

    if(decodeResult.intent != _INTENT_UNKNOWN_)
    {
      if(decodeResult.sendToAI==false)
      {
        const newId = await conversationDB.AddDialog(decodeResult.final_userMsg, decodeResult.final_botMsg);
        //document.getElementById(rspMsgId).setAttribute('onclick',`click_delete_dialog('${newId}')`)
        await msgGetHistory()
        return;
      }
      else
      {
        input = decodeResult.final_userMsg;
      }
      
    }
  }
  else
  {
    if(input.startsWith(_SYS_INPUT_PERSON_DATA_))
    {
      input = input.replace(_SYS_INPUT_PERSON_DATA_, '');
      //final_userMsg = await get_related_question_from_person_profile(result);
    }
  }
  

  const brain = persona;
  const userMsg = input == null ? '' : `${persona.user_name}:${input.trim()}`;

  let p_user = await conversationDB.ConstructQueryContext(
    "CGPT", brain, userMsg, 
    3, [""], [""], 
    500, 0, 500, 
    0.7, 1.0, 0.8,
    3.3)
  console.log(p_user);

  var newId = util.GetTimeStamp();
  render_msg(JSON.stringify({
      timestamp: newId,
      dialogId: newId,
      text: userMsg,
      from: 'me'
    }));
  const rspMsgId = render_msg(JSON.stringify({
        timestamp: newId,
        dialogId: newId,
        text: "",
        from: 'bot'
      }));
  const rspMsgTextArea = document.getElementById(rspMsgId);
  //console.log(rspMsgTextArea);


  const inf_temp = Number(brain.inf_temperature ?? 0.7);
  const inf_maxgen = Number(brain.inf_maxgen ?? 256);
  let rsp = "";

  if (docById("opt_llm").value == "CGPT")
    rsp = await call_ai.call_oai_completion_stream("", p_user, oaiKey, rspMsgTextArea, inf_temp, inf_maxgen);
  else
    rsp = await call_ai.call_ll2_completion(p_user, ["</s>", brain.user_name + ":"], rspMsgTextArea, inf_temp, inf_maxgen);

  if (rsp.includes("[ERROR")) {
    alert(rsp);
  } else {

    rsp = util.CleanDateTimeISO(rsp);
    rsp = rsp.replaceAll(persona.persona_name + ":", "").trim();
    const botMsg = `${persona.persona_name}:${rsp}`;
    rspMsgTextArea.textContent = botMsg;

    const newId = await conversationDB.AddDialog(userMsg, botMsg);
    //document.getElementById(rspMsgId).setAttribute('onclick',`click_delete_dialog('${newId}')`)
    await msgGetHistory()
  }
}

async function msgGetHistory() {
  docById('messages').innerHTML = "";
  let dialogs = await conversationDB.GetHistory(50);

  //dialogs.shift() //remove first dialog
  for (const dialog of dialogs) {
    render_msg(JSON.stringify({
        timestamp: dialog[0],
        dialogId: dialog[3],
        text: dialog[1],
        from: 'me'
      }));
    render_msg(JSON.stringify({
        timestamp: dialog[0],
        dialogId: dialog[3],
        text: dialog[2],
        from: 'bot'
      }));
  }
  scrollMessageToBottom()
}

async function msgClearHistory() {
  await idb.SaveIDBObject(conversation);
}

async function msgEdit(msgId = "msg GUID") {
  const oaiKey = util.DecX(tb_oai_key.value, dbName);
  if (oaiKey == "") {
    const msg = `[ERROR: OAI - API key is empty]`
      alert(msg);
    return;
  }
  conversationDB.SetOpenAIApiKey(oaiKey);

  const dialog = await conversationDB.GetDialog(msgId);
  console.log(dialog);
  const user_name = docById('user_name').value;
  const persona_name = docById('persona_name').value;

  dlg_lbl_edit_dialog_ta_user.textContent = user_name.replace(":", "");
  dlg_lbl_edit_dialog_ta_persona.textContent = persona_name.replace(":", "");
  dlg_edit_dialog_ta_user.value = dialog[1].replace(user_name + ":", "");
  dlg_edit_dialog_ta_persona.value = dialog[2].replace(persona_name + ":", "");
  dlg_edit_dialog.msgId = msgId;
  dlg_edit_dialog.showModal();
}
async function dlgEditDialogSubmit() {
  docById('dlg_info_title').textContent = "Updating Dialog";
  dlg_info.showModal();

  const msgUser = `${docById('user_name').value}:${dlg_edit_dialog_ta_user.value}`;
  const msgPersona = `${docById('persona_name').value}:${dlg_edit_dialog_ta_persona.value}`;
  //console.log(msgUser)
  //console.log(msgPersona)
  await conversationDB.UpdateDialog(dlg_edit_dialog.msgId, msgUser, msgPersona);
  dlg_info.close();
}

async function importJSONData(event) {
  try {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async(event) => {
      const contents = event.target.result;
      const data = JSON.parse(contents);
      const dataType = data.dataType ?? "";

      if (dataType != "conversation" && dataType != "persona" && dataType != "knowledgebase" && dataType != "agent") {
        alert("Invalid JSON File");
      } else {

        if (dataType == "agent") {
          const userRsp = confirm(`Replace Agent data with this JSON ?`);
          if (userRsp) {
            if (data['persona'] != null)
              await idb.SaveIDBObject(data['persona']);
            if (data['conversation'] != null)
              await idb.SaveIDBObject(data['conversation']);
            if (data['knowledgebase'] != null)
              await idb.SaveIDBObject(data['knowledgebase']);
            alert("Finished importing JSON file");
            location.reload();
          }
        } else {
          const userRsp = confirm(`Replace ${dataType.toUpperCase()} with this JSON ?`);
          if (userRsp) {
            //console.log(data);
            await idb.SaveIDBObject(data);
            alert("Finished importing JSON file");
            location.reload();
          } else {
            location.reload();
          }
        }

      }
    };

    reader.readAsText(file);

  } catch (error) {
    alert("Invalid JSON File")
  }

}

async function exportJSONData() {
  let obj = {};

  obj.dataType = "agent";
  obj.persona = await idb.GetIDBObject("persona");
  obj.conversation = await idb.GetIDBObject("conversation");
  obj.knowledgebase = await idb.GetIDBObject("knowledgebase");
  util.saveAsFile(`${dbName}-${util.GetTimeStamp()}.json`, obj, document);
}

async function click_delete_dialog(dialog_id) {
  await conversationDB.DeleteDialog(dialog_id);
  await msgGetHistory();
}

async function kbAddItem() {
  docById('dlg_info_title').textContent = "Importing Knowledge Base";
  dlg_info.showModal();
  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  vectorDB.SetOpenAIApiKey(oaiKey);
  //alert(`${kb_input_title.value} ${kb_input_isGiantText.checked} ${kb_input_textchunker_chunkSize.value} ${kb_input_textchunker_chunkOverlap.value}`)
  await vectorDB.IntegrateText(kb_input_title.value, "", kb_input_content.value, kb_input_isGiantText.checked, kb_input_textchunker_chunkSize.value, kb_input_textchunker_chunkOverlap.value);
  await kbGetTitles();
  dlg_info.close("");
}

async function kbImportPDF(event) {
  const file = event.target.files[0];
  kb_input_title.value = file.name;

  const fileReader = new FileReader();
  fileReader.onload = async function (e) {
    const typedArray = new Uint8Array(e.target.result);
    console.log(typedArray.length);

    /////
    let pdfjsLib = window['pdfjs-dist/build/pdf']; // Loaded via <script> tag, create shortcut to access PDF.js exports.
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

    pdfjsLib.getDocument(typedArray).promise.then(async function (pdf) {
      const totalPages = pdf.numPages;
      kb_input_isGiantText.checked = true;
      let p_text = ""
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const pageTextContent = await page.getTextContent();
          kb_input_content.value += `_PN_:${pageNumber}\n`;
          for (const item of pageTextContent.items) {
            kb_input_content.value += item.str + '\n';
          }
        }
        alert("Import PDF: FINISHED");
    });
    /////
  }

  fileReader.readAsArrayBuffer(file);
}

async function kbDeleteItem(docTitle) {
  let vdb = vectorDB;
  await vdb.DeleteTitle(vdb.DATA_TYPE_KB, docTitle);
  await kbGetTitles();
}

async function kbGetTitles() {
  let vdb = vectorDB;
  let divDocTItles = docById('div_user_documents');
  let listDocTitles = await vdb.GetDocTitles(vdb.DATA_TYPE_KB);
  console.log(listDocTitles)
  let docTitles = "";

  let btnIdx=0;
  for (const e of listDocTitles) {
    docTitles += `<dt style="font-weight:inherit;"><button id="btn_kbdel_${btnIdx++}" style="border:none;background-color:transparent;color:red;">X</button>${e}</dt>`
    //console.log(e)
  }

  docTitles = `<dl>${docTitles}</dl>`
  divDocTItles.innerHTML = docTitles;

  btnIdx=0;
  for (const docTitle of listDocTitles) {
    let btnIdName = `btn_kbdel_${btnIdx++}`;
    docById(btnIdName).addEventListener('click', async function () {
      /*
      await vectorDB.DeleteTitle(vdb.DATA_TYPE_KB, docTitle);
      await kbGetTitles();
      */
      await kbDeleteItem(docTitle);
    });
  }

}


//DOM finished loading
onload = async function () {
  
  
  //Send user message
  docById('message-input').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById('message-send').click();
    }
  });
  docById('message-send').addEventListener('click', async function () {
    //docById('message_input').
    const usrMsg = docById('message-input').value;
    if(!usrMsg.startsWith('cmd_') && usrMsg.split(' ').length<3) return;

    docById('message-input').value = "";
    docById('message-input').readOnly = true;
    docById('message-send').disabled = true;

    await msgSend(usrMsg)
    docById('message-input').readOnly = false;
    docById('message-send').disabled = false;
    //console.log("btn_submit_persona_chat");
  });

  //Input Person Data
  docById('dlg_get_person_data').querySelectorAll('input').forEach(x => x.style.textAlign = "center");
  docById('btn_data_pasangan').addEventListener('click', async function () {
    open_get_person_data("Data Orang Lain");
  });
  docById('dlg_get_person_data_btn_submit').addEventListener('click', async function () {
    submit_get_person_data()
  });
  docById('dlg_get_person_data_btn_cancel').addEventListener('click', async function () {
    dlg_get_person_data.close('')
  });
  
  //Info screeen
  docById('btn_help_open').addEventListener('click', async function () {
    docById('div_help').style.display="block";
    docById('div_help').style.width="100vw";
    docById('div_help').style.height="100vh";

    docById('message_input').style.display="none";
    docById('div_chat_menu_bar').style.display="none";
  });
  docById('btn_help_close').addEventListener('click', async function () {
    docById('div_help').style.display="none";
    docById('div_help').style.width="0vw";
    docById('div_help').style.height="100vh";
    
    docById('message_input').style.display="block";
    docById('div_chat_menu_bar').style.display="block";
  });
  docById('btn_logout').addEventListener('click', async function () {
    if (confirm("Anda yakin mau Log-out ?") == true) {
      await log_out()
    } else {
      //text = "You canceled!";
    }
    
  });
  docById('div_help_greetings').innerHTML = persona.persona_greetings;
  docById('ver_info').textContent = version;

  //KB stuff
  docById('kb_input_content_cancel').addEventListener('click', async function () {
    dlg_kb_input.close('')
  });
  docById('kb_input_content_submit').addEventListener('click', async function () {
    await kbAddItem()
  });

  let file_import_pdf = docById('file_import_pdf');
  file_import_pdf.addEventListener('change', kbImportPDF);

  const file_import_json = docById('file_import_json');
  file_import_json.addEventListener('change', importJSONData);

  //Start-up sequence
  await load_user_idb();
  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);
  if(conversation.textChunks.length==1)open_get_person_data("Data Saya");

  await userIntentGetVectors();

};

