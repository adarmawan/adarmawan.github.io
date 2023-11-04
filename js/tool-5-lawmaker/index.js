import * as call_ai from "../../modules/call_ai.js"
import * as idb from "../../modules/IndexDB.js"
import * as util from '../../modules/utility.js';
import * as math from '../../modules/math.js'
import kmeans from '../../modules/kmeans.js'
import {VectorDB} from "../../modules/VectorDB.js";
import {ConversationDB} from "../../modules/ConversationDB.js";
import {LawCaseClassifier} from "./LawCaseClassifier.js";
//import * as kb_kuhp from "./kb_kuhp_v2.js";
//import * as kb_kuhp from "./KB_KUHP_2022_V3_Vectors.js";
//import * as kb_kuhp from "./KB_KUHP_2022_V4_Vectors.js";
import * as kb_kuhp from "./KB_KUHP_2022_V4_Text.js";
import * as lawCaseSamples from "./LawCaseSamples.js";

const version = "v.001"
const dbName = "ynbt-lite-AI_Agent-Lawmaker";
idb.SetDBName(dbName)
const vectorDB = new VectorDB();
const conversationDB = new ConversationDB();
const lawCaseClassifier = new LawCaseClassifier();

//<!-- DATA -->
const textChunker = {
  "dataType": "textchunker",
  "chunk_size": 200,
  "chunk_overlap": 5,
};
const QUESTIONER_DATA = 
[
  {
    "Question": "Involving sexual assault: Yes or No",
    "Answer": "",
    "RelatedPasal": ["285","289","290","291","294","295","336"]
  },
  {
    "Question": "Involving theft or robbery: Yes or No",
    "Answer": "",
    "RelatedPasal": ["362","363","364","365"]
  },
  {
    "Question": "Involving violence: Yes or No",
    "Answer": "",
    "RelatedPasal": ["89","170","285","336","351","352","353","365"]
  },
  {
    "Question": "Involving extortions: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Involving traffic accident: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Involving workplace accident: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Involving private properties destruction: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Involving public properties destruction: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Involving self-defense: Yes or No",
    "Answer": "",
    "RelatedPasal": ["49"]
  },
  {
    "Question": "Any indication of premeditated crime: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Is this incident happened intentionally: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Is multiple people involved in the crime: Yes or No",
    "Answer": "",
    "RelatedPasal": ["55"]
  },
  {
    "Question": "Is the offender dead: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Is the offender under age: Yes or No",
    "Answer": "",
    "RelatedPasal": ["37","45","46", "91",]
  },
  {
    "Question": "Is the victim injured: Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Is the victim permanently injured (crippled, lost limbs, blind, mute): Yes or No",
    "Answer": "",
    "RelatedPasal": []
  },
  {
    "Question": "Is the victim dead: Yes or No",
    "Answer": "",
    "RelatedPasal": ["46",]
  },
  {
    "Question": "Is the victim under age: Yes or No",
    "Answer": "",
    "RelatedPasal": ["37","91","287","292","293","294","295","301","305","330","331",]
  }
]

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

const _P_EXTRACT_CASE_SUMMARY_=
`[KASUS HUKUM]
_DATA_

===INSTRUCTION
Write a concise summary of [KASUS HUKUM]. Preserve all names,all accomplices, places,dates,tools,weapons. Don't write anything else.
`

const _P_EXTRACT_CASE_QUESTIONER_ANSWERS_REASONING_=
`_DATA_

===INSTRUCTION
For every "Yes" answer in questioner info, please write your reasoning:`


const _P_EXTRACT_CASE_ACTORS_DETAILS_=
`[KASUS HUKUM]
_DATA_

===OUTPUT FORMAT
- Pelaku Pidana:
1. Name : role in this incident (your notes)
2. Name : role in this incident (your notes)
other pelaku pidana.

- Korban:
1. Name : role in this incident (your notes)
2. Name : role in this incident (your notes)
other korban.

===INSTRUCTION
Please deeply analyze [KASUS HUKUM].
Extract all Pelaku Pidana and their roles, as bulletpoints.
Extract all Korban as bulletpoints.
Korban can not be Pelaku Pidana.
`
const _P_APPLY_ALL_PASAL_TO_ALL_ACTORS_=
`[KASUS HUKUM]
_LAW_CASE_

[ACTORS DETAILS]
_ACTORS_DETAILS_

[QUESTIONER INFO REASONING]
_QUESTIONER_INFO_REASONING_

[RELATED KUHP PASAL]
_RELATED_KUHP_PASAL

===INSTRUCTION
Use all the data you have to attach all Pasal-pasal applicable to each actor in the law case.
`

const _P_APPLY_ALL_PASAL_TO_PELAKU_PIDANA_=
`[KASUS HUKUM]
_LAW_CASE_

[ACTORS DETAILS]
_ACTORS_DETAILS_

[QUESTIONER INFO REASONING]
_QUESTIONER_INFO_REASONING_

[RELATED KUHP PASAL]
_RELATED_KUHP_PASAL

===INSTRUCTION
Always consider the age of the offender(s) and the victim(s) when choosing the pasals.
Choose the most relevant pasals based on [QUESTIONER INFO REASONING].
Sort the attached pasal with the most severe punishment first. Write the punishment too.
Attach all Pasal-pasal applicable to each pelaku pidana in the law case.`


var persona = {
  "dataType": "persona",
  "persona_greetings": "Namaku adalah Sofia<br><br>Aku adalah seorang penasehat spritual, yang sangat ahli mengenai numerologi Primbon Jawa dan Jalur Hidup<br><br>Berdasarkan hari kelahiran seseorang, Aku dapat memberikan nasehat mengenai sifat-sifat dan kehidupan engkau dan orang lain disekitarmu.",
  "persona_context":"",
  
  "persona_info":"Saya adalah Dewi Sofia, pemberi nasehat bijaksana dengan keahlian dalam psikologi, bisnis, dan percintaan. Saya selalu memulai dengan 'Wahai Anaku' untuk jawaban singkat yang bermakna.",

  "persona_name": "Sofia",

  "user_name": "User",

  "tb_oai_key": "CgVPLn0iAEQiSHEgEy4MNB0tRiFWAgo1WCceGwUkPls1XxgQazM6DRkuMyQzeyIFTx05",
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

var Intent_Decode_Result = {
    intent: "UNKNOWN",
    final_userMsg: "",
    final_botMsg: "",
    sendToAI: true
}

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


async function userIntentDecode(userMsg)
{
  //I dont know !!
  Intent_Decode_Result.sendToAI = false;
  Intent_Decode_Result.final_userMsg = userMsg;
  Intent_Decode_Result.final_botMsg = "";
  Intent_Decode_Result.intent = _INTENT_UNKNOWN_;
  Intent_Decode_Result.sendToAI = true;
  return Intent_Decode_Result;
}


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
    //await msgGetHistory();
  } else {
    await idb.SaveIDBObject(conversation)
    //await msgGetHistory();
  }

  const u_k = await idb.GetIDBObject("knowledgebase");
  if (u_k != null) {
    //await kbGetTitles();
  } else {
    await idb.SaveIDBObject(knowledgebase)
    //await kbGetTitles();
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

async function bookSearch_buku_bab(searchTerm='', div_search_result_id)
{
  const searchTermNorm = searchTerm.toLowerCase();
  const regex = /^buku\s+([a-zA-Z]+)(?:,\s*bab\s+([a-zA-Z]+)\s*)$/i;
  const match = searchTermNorm.match(regex);
  if (match) 
  {
    let isFound = false;
    let buku = `BUKU ${match[1].toUpperCase()}`
    let bab = `BAB ${match[2].toUpperCase()}`
    console.log(`MATCHED--> ${buku} ${bab}`);
    docById(div_search_result_id).innerHTML = "";
    for (const tc of kb_kuhp.data.textChunks) 
    {
      if( tc.keyConcepts[0].startsWith(buku) && tc.keyConcepts[1].startsWith(bab) )
      {
        let res = `<div style="margin:0.5em;"> ${tc.keyConcepts[0]},${tc.keyConcepts[1]}<br>${tc.keyConcepts[2]}<br>[${tc.text}]<br>${tc.fullText}</div><br>`;
        
        //console.log(`${tc.keyConcepts[2]}`);
        docById(div_search_result_id).innerHTML += res;
        isFound = true;
      }
    }
    return isFound;
  } 
  
  return false;
}

async function bookSearch_pasal(searchTerm='', div_search_result_id)
{
  const searchTermNorm = searchTerm.toLowerCase();
  if(searchTermNorm.startsWith('pasal '))
  {

    let isFound = false;
    docById(div_search_result_id).innerHTML = "";
    for (const tc of kb_kuhp.data.textChunks) 
    {
      if( tc.keyConcepts[2].toLowerCase().startsWith(searchTermNorm))
      {
        let res = `<div style="margin:0.5em;"> ${tc.keyConcepts[0]},${tc.keyConcepts[1]}<br>${tc.keyConcepts[2]}<br>[${tc.text}]<br>${tc.fullText}</div><br>`;
        
        //console.log(`${tc.keyConcepts[2]}`);
        docById(div_search_result_id).innerHTML += res;
        isFound = true;
      }
    }
    return isFound;
  }

  return false;
}

async function bookSearch_semanticCompunding(searchTerm='')
{
  let sentenceVectors = [];
  let tokenVectors = []; // [[],[],[]]
  let dirtyResults = [];
  let cleanResultIds = [];
  let cleanResults = [];

  let termTokens = searchTerm.split(",");
  termTokens = util.RemoveWhitespaceItems(termTokens);

  //Sentence Vectors and Search
  sentenceVectors = await vectorDB.GetSentenceVectors(searchTerm);
  const ss = await vectorDB.SearchMemory(VectorDB.DATA_TYPE_KB,kb_kuhp.data,sentenceVectors, searchTerm, [""],[""],0.8,10)
  dirtyResults.push(...ss)
  if(termTokens.length<2) return ss;

  //Token Vectors and Search
  for (const tok of termTokens) {
    const tv = await vectorDB.GetSentenceVectors(tok);
    const ts = await vectorDB.SearchMemory(VectorDB.DATA_TYPE_KB,kb_kuhp.data,tv, tok, [""],[""],0.8,10)
    tokenVectors.push(tv);
    dirtyResults.push(...ts)
  }
  
  // Use an object to keep track of unique IDs
  var uniqueIds = {};
  // Filter out duplicates based on the "id" field
  cleanResults = dirtyResults.filter(function(item) {
    // If the ID is encountered for the first time, add it to the uniqueIds object
    // and include the item in the result
    if (!uniqueIds[item.id]) {
      uniqueIds[item.id] = true;
      return true;
    }
    // If the ID has already been encountered, exclude the item from the result
    return false;
  });
 
  // Sort dirtyResults based on the 'val' field in descending order
  cleanResults.sort(function(a, b) {
    return b.val - a.val;
  });

  var IdAndVals = cleanResults.map(function(item) {
    return { id: item.id, val: item.val };
  });
  console.log(IdAndVals)

  return cleanResults
}


async function bookSearch(searchTerm='', div_search_result_id)
{
  let isFound = false;
  isFound = await bookSearch_buku_bab(searchTerm, div_search_result_id);
  if(isFound) return;
  isFound = await bookSearch_pasal(searchTerm, div_search_result_id)
  if(isFound) return;


  docById('dlg_info_title').textContent = "... Searching ...";
  dlg_info.showModal();
  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  vectorDB.SetOpenAIApiKey(oaiKey);
  //const searchVectors = await vectorDB.GetSentenceVectors(searchTerm);
  //const searchResults = await vectorDB.SearchMemory(VectorDB.DATA_TYPE_KB,kb_kuhp.data,searchVectors, searchTerm, [""],[""],0.8,10)
  
  const searchResults = await bookSearch_semanticCompunding(searchTerm)
  dlg_info.close("");

  
  searchResults.sort(function(a, b) {
    // Convert titles to numbers for proper numerical comparison
    var titleA = parseInt(a.title.replace(/\D/g, ''), 10);
    var titleB = parseInt(b.title.replace(/\D/g, ''), 10);
  
    return titleA - titleB;
  });
  

  docById(div_search_result_id).innerHTML = "";
  let resList = ``;
  for (const tc of searchResults) 
  {
    let res = `<div style="margin:0.5em;"> ${tc.keyConcepts[0]}<br>${tc.keyConcepts[1]}<br>${tc.keyConcepts[2]}<br>[${tc.text}]<br>${tc.fullText.replaceAll(`\n`,`<br>`)}</div><br>`;
    //resList +=`<div> ${it.keyConcepts.join("<br>")}<br>${it.text}</div><br>`
    resList += res;

    docById(div_search_result_id).innerHTML += res;
    //await util.delay(100);
  }

  //docById('div_search_results').innerHTML = resList;
  console.log(searchResults[0].text)
}

var CASE_DETAILS = {
  Description: "",
  Summary: "",
  ActorsDetails:"",
  QuestionerInfo: "",
  QuestionerInfoReasoning: "",
  RelatesPasals:"",
  ScratchPad: ""
}


async function caseAnalyzeStep1()
{
  docById('dlg_info_title').textContent = "... THINKING ...";
  dlg_info.showModal();

  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);

  //const ta_kasus_analisa = docById('ta_kasus_analisa')
  //ta_kasus_analisa.value = "";

  //const ta_case_summary = docById('ta_case_summary')
  ta_case_summary.value = "";

  //const ta_case_actors = docById('ta_case_actors')
  ta_case_actors.value = "";

  //const ta_case_classifier = docById('ta_case_classifier')
  ta_case_classifier.value = "";

  //const ta_case_classifier_reasoning = docById('ta_case_classifier_reasoning')
  ta_case_classifier_reasoning.value = "";

  //const ta_case_related_pasal = docById('ta_case_related_pasal')
  ta_case_related_pasal.value = "";

  //const ta_case_apply_pasal = docById('ta_case_apply_pasal')
  ta_case_apply_pasal.value = "";



  
  const caseDetailText = docById('ta_kasus_posisi').value;

  
  CASE_DETAILS.ScratchPad = "";
  CASE_DETAILS.Description = caseDetailText;

  //Extract case summary
  const _p_summary_ = _P_EXTRACT_CASE_SUMMARY_.replace('_DATA_', caseDetailText)
  //ta_kasus_analisa.value +=`[KASUS HUKUM]\n`
  //const caseSummaryText = await call_ai.call_oai_completion_stream("", _p_summary_ , oaiKey, ta_kasus_analisa, 0, 512)
  const caseSummaryText = await call_ai.call_oai_completion_stream("", _p_summary_ , oaiKey, ta_case_summary, 0, 512)
  CASE_DETAILS.Summary = caseSummaryText;

  //Extract case actors details
  const _p_actors_ = _P_EXTRACT_CASE_ACTORS_DETAILS_.replace('_DATA_', caseSummaryText)
  //ta_kasus_analisa.value +=`\n\n[ACTORS DETAILS]\n`
  //const caseActors = await call_ai.call_oai_completion_stream("", _p_actors_ , oaiKey, ta_kasus_analisa, 0, 512)
  const caseActors = await call_ai.call_oai_completion_stream("", _p_actors_ , oaiKey, ta_case_actors, 0, 512)
  CASE_DETAILS.ActorsDetails = caseActors;
  console.log(_p_actors_)

  //Extract case info questioner
  const _p_info_ = lawCaseClassifier.GetQuestionerPrompt(`${caseSummaryText}\n\n[ACTORS DETAILS]\n\n${caseActors}`)
  //ta_kasus_analisa.value +=`\n\n[QUESTIONER INFO]\n`
  //const caseInfoQuestioner = await call_ai.call_oai_completion_stream("", _p_info_ , oaiKey, ta_kasus_analisa, 0, 512)
  //let _p_sys_ = "Rules to follow:Kidnaping is NOT theft or robbery,Self defence can not be charged for anything, Every Pelaku Pidana should also be charged by Pasal 55 (Pelaku Pidana dan Penganjur dalam Hukum Pidana)";
  let _p_sys_ = ""
  const caseInfoQuestioner = await call_ai.call_oai_completion_stream(_p_sys_, _p_info_ , oaiKey, ta_case_classifier, 0, 512)
  CASE_DETAILS.QuestionerInfo = caseInfoQuestioner;
  console.log(_p_info_)
  
  //Generate reasoning for info questioner answers
  lawCaseClassifier.SetAnswers(caseInfoQuestioner)
  const yesAnswers = lawCaseClassifier.GetAnswersYes()
  const noAnswers =  lawCaseClassifier.GetAnswersNo()
  const _p_info_reasoning_ = _P_EXTRACT_CASE_QUESTIONER_ANSWERS_REASONING_
  .replace('_DATA_', `[KASUS HUKUM]\n${caseSummaryText}\n[QUESTIONER INFO]\n${yesAnswers}`)
  //ta_kasus_analisa.value +=`\n\n[QUESTIONER INFO REASONING]\n`
  //const caseInfoQuestionerReasonings = await call_ai.call_oai_completion_stream("", _p_info_reasoning_ , oaiKey, ta_kasus_analisa, 0, 512)
  const caseInfoQuestionerReasonings = await call_ai.call_oai_completion_stream("You are a helpfull assistant", _p_info_reasoning_ , oaiKey, ta_case_classifier_reasoning, 0, 512)
  CASE_DETAILS.QuestionerInfoReasoning = caseInfoQuestionerReasonings
  console.log(_p_info_reasoning_)

  //Generate Related Pasal
  //ta_kasus_analisa.value +=`\n\n[RELATED KUHP PASAL]\n`
  let relatedPasalList = lawCaseClassifier.GetAnswersYesRelatedPasal()
  for (const tc of kb_kuhp.data.textChunks) 
  {
    for (const relPasal of relatedPasalList) 
    {
      let searchTermNorm = `pasal ${relPasal}`
      if( tc.keyConcepts[2].toLowerCase() == searchTermNorm)
      {
        //let res = `${tc.keyConcepts[0]}\n${tc.keyConcepts[1]}\n${tc.keyConcepts[2]}\n[${tc.text}]\n${tc.fullText}\n`;
        //let res = `${tc.keyConcepts[2]}\n[${tc.text}]\n${tc.fullText}\n`;
        //let res = `${tc.keyConcepts[2]}\n[${tc.text}]\n`;
        //let res = `${tc.keyConcepts[2]}\n${tc.fullText}\n`;
        let res = `${tc.keyConcepts[2]} : ${tc.text}\n${tc.fullText}\n`;
        ta_case_related_pasal.value += res
      }  
    }
    
  }
  CASE_DETAILS.RelatesPasals = ta_case_related_pasal.value

  //Generate Case Actors Pasals Apply
  await GenerateApplyPasalsToCaseActors(caseSummaryText, caseActors, caseInfoQuestionerReasonings, oaiKey);


  //CASE_DETAILS.ScratchPad = ta_kasus_analisa.value ;
  //console.log(CASE_DETAILS)
  dlg_info.close("");
}


async function GenerateApplyPasalsToCaseActors(caseSummaryText, caseActors, caseInfoQuestionerReasonings, oaiKey) {
  const _p_apply_pasal_to_actors_ = _P_APPLY_ALL_PASAL_TO_PELAKU_PIDANA_
    .replace('_LAW_CASE_', caseSummaryText)
    .replace('_ACTORS_DETAILS_', caseActors)
    .replace('_QUESTIONER_INFO_REASONING_', caseInfoQuestionerReasonings)
    .replace('_RELATED_KUHP_PASAL', ta_case_related_pasal.value);

  ta_case_apply_pasal.value = ""
  const curTokenCount = util.GetTokenCount(_p_apply_pasal_to_actors_, 3.0) //Indonesian
  console.log(curTokenCount)
  

  console.log(_p_apply_pasal_to_actors_);
  let aiModelToUse = "gpt-3.5-turbo";
  if(curTokenCount>3500)
  {
    aiModelToUse = "gpt-3.5-turbo-16k";
  }
  const caseIActorsPasalsApply = await call_ai.call_oai_completion_stream("You are an Indonesian Police Officer", _p_apply_pasal_to_actors_, oaiKey, ta_case_apply_pasal, 0, 1500, aiModelToUse);
  
  console.log(caseIActorsPasalsApply);
}

function createWndSearch(searchTerm="")
{
  let wndId = util.GetTimeStamp();
  let tb_search_term_id = `tb_search_term_${wndId}`
  let btn_search_submit_id = `btn_search_submit_${wndId}`
  let div_search_result_id = `div_search_results_${wndId}`
  const wnd_search = new WinBox({
    title: "Semantic Search: KUHP-2022",
    class: "dark no-max no-full no-close",
    min: false,
    x: "60%",
    y: "0",
    width: "40%",
    height: "80%",
    html: `
        <div id="container_search_${wndId}" class_="row">
          
          <div id="div_search_bar_${wndId}" class="div_search_bar mb-3 hstack">  
              <input style="width:90%;" id="${tb_search_term_id}" value="${searchTerm}"  list="search_samples">
              <datalist id="search_samples">
                <option value="buku kesatu, bab ii"></option>
                <option value="pasal 55"></option>
                <option value="index"></option>
              </datalist>
              <button class="btn btn-secondary btn-sm" id="${btn_search_submit_id}">Search</button>
          </div>
          
          <div id="${div_search_result_id}" class="div_search_results">
          </div>
    
        </div>        
      `
    });

    docById(btn_search_submit_id).addEventListener('click',async function(){
      const searchTerm = docById(tb_search_term_id).value;
      await bookSearch(searchTerm, div_search_result_id);
    })

    return wnd_search;
}


const wnd_kasus = new WinBox({
  title: "Kasus Posisi",
  class: "dark no-max no-full no-close",
  min: false,
  x: "0%",
  y: "0",
  width: "30%",
  height: "45%",
  html: `
      <div id="container_kasus" class_="col">
        <button class="btn btn-secondary btn-sm" id="btn_kasus_submit">Submit</button>
        <select id="dd_law_case_samples">
        <option value="">Choose A Sample Case</option>
        </select>

        <textarea style="width:100%;height:90%;" id="ta_kasus_posisi"></textarea>
      </div>        
    `
  });

const wnd_kasus_analisa = new WinBox({
    title: "Analisa Kasus",
    class: "dark _no-max no-full no-close",
    min: false,
    x: "30%",
    y: "0",
    width: "70%",
    height: "90%",
    html: `

        <div id="container_kasus_analisa" class="row gx-1" style="height:100%;margin:0.25rem;">
          <div id="" class="row gx-1" style="height:50%;">
            <div id="" class="col">
              SUMMARY
              <textarea style="width:100%;height:90%;" id="ta_case_summary"></textarea>
            </div>  
            <div id="" class="col">
              ACTORS
              <textarea style="width:100%;height:90%;" id="ta_case_actors"></textarea>
            </div> 
            <div id="" class="col">
              CLASSIFIER
              <textarea style="width:100%;height:90%;" id="ta_case_classifier"></textarea>
            </div>   
            
            <div id="" class="col">
              REASONING
              <textarea style="width:100%;height:90%;" id="ta_case_classifier_reasoning"></textarea>
            </div> 
            
            <div id="" class="col" style="display:none;">
              RELATED PASAL
              <textarea style="width:100%;height:90%;" id="ta_case_related_pasal"></textarea>
            </div> 
          </div>

          <div id="" class="row gx-1" style="height:50%;">
            <div class_="row">
            APPLIED PASAL
            <button class="btn btn-secondary btn-sm" id="btn_retry_apply_pasals_to_actors">Retry</button>
            <button class="btn btn-secondary btn-sm" id="btn_export_results" style="float: right;">Export Result</button>
            </div>
            
            <textarea style="width:100%;height:90%;" id="ta_case_apply_pasal"></textarea>
          </div
        </div>        

            
      `
    });


//DOM finished loading
onload = async function () {
  
  
  //Case Samples
  const dd_law_case_samples = docById('dd_law_case_samples')
  for (const item of lawCaseSamples.data) {
    var option = document.createElement("option");
    option.value = item.Text;
    option.text = item.Title;
    dd_law_case_samples.appendChild(option);
  }
  dd_law_case_samples.addEventListener("change",async function(){
    docById('ta_kasus_posisi').value = docById('dd_law_case_samples').value
  })

  //Search stuff
  const wnd_search = createWndSearch("kejahatan terhadap anak")
  wnd_search.minimize(true);

  
  //Const Objects
  const ta_kasus_analisa = docById('ta_kasus_analisa')
  const ta_case_summary = docById('ta_case_summary')
  const ta_case_actors = docById('ta_case_actors')
  const ta_case_classifier = docById('ta_case_classifier')
  const ta_case_classifier_reasoning = docById('ta_case_classifier_reasoning')
  const ta_case_related_pasal = docById('ta_case_related_pasal')
  const ta_case_apply_pasal = docById('ta_case_apply_pasal')

  //Case STuff
  docById('btn_kasus_submit').addEventListener('click',async function(){
    await caseAnalyzeStep1();
  })
  docById('btn_retry_apply_pasals_to_actors').addEventListener('click',async function(){
    const oaiKey = util.DecX(persona.tb_oai_key, dbName);
    conversationDB.SetOpenAIApiKey(oaiKey);
    vectorDB.SetOpenAIApiKey(oaiKey);
    await GenerateApplyPasalsToCaseActors(CASE_DETAILS.Summary,CASE_DETAILS.ActorsDetails, CASE_DETAILS.QuestionerInfoReasoning, oaiKey);
  })

  docById('btn_export_results').addEventListener('click',async function(){
    const caseDetailText = docById('ta_kasus_posisi').value;
    var doc = 
    `[KASUS HUKUM]\n${caseDetailText}\n\n`+
    `[RINGKASAN KASUS HUKUM]\n${ta_case_summary.value}\n\n`+
    `[PIHAK YANG TERKAIT]\n${ta_case_actors.value}\n\n`+
    `[KLASIFIKASI KASUS HUKUM]\n${ta_case_classifier_reasoning.value}\n\n`+
    `[APLIKASI PASAL KUHP TERHADAP PARA PIHAK]\n${ta_case_apply_pasal.value}\n\n`

    util.saveAsFileText(`AnalisaKasusHukum-${util.GetTimeStamp()}.txt`, doc, document);
  })


  //Start-up sequence
  await load_user_idb();
  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);
  
  //await userIntentGetVectors();

};

