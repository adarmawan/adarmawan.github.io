import * as call_ai from "../../modules/call_ai.js"
import * as idb from "../../modules/IndexDB.js"
import * as util from '../../modules/utility.js';
import * as klenik from '../../modules/Klenik.js';
import {
  VectorDB
}
from "../../modules/VectorDB.js";
import {
  ConversationDB
}
from "../../modules/ConversationDB.js";

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

const _P_DECODE_USER_INTENT_=
`===USER_INTENT
- Tanya perjodohan
- Tanya hari baik
- Tanya sifat seseorang
- Input data pribadi sendiri
- Input data pribadi orang lain
- UNKNOWN

===USER_QUERY
_USER_MSG_

===INSTRUCTION
which USER_INTENT has the closest meaning to the USER_QUERY? Don't add anything else to your answer.
`
const _P_EXTRACT_PERSONAL_INFORMATION_=
`===USER_QUERY
_USER_MSG_

===INSTRUCTION
extract personal information from USER_QUERY as a JSON with fields:name,birthday,relation. Date fields always in "yyyy-mm-dd" format.`



var persona = {
  "dataType": "persona",
  
  "persona_greetings": "Namaku adalah Sofia<br><br>Aku adalah seorang penasehat spritual, yang sangat ahli mengenai numerologi Primbon Jawa dan Jalur Hidup<br><br>Berdasarkan hari kelahiran seseorang, Aku dapat memberikan nasehat mengenai sifat-sifat dan kehidupan engkau dan orang lain disekitarmu.",
 
 "persona_info": "Namaku adalah Sofia. Aku adalah seorang penasehat spritual, yang sangat ahli mengenai numerologi Primbon Jawa dan Jalur Hidup. Berdasarkan hari kelahiran seseorang, Aku dapat memberikan nasehat mengenai sifat-sifat dan kehidupan engkau dan orang lain disekitarmu.",
  "persona_context": "  Aku akan menggunakan seluruh profile psikologi seseorang dan percakapan sebelumnya, sebagai data dasar untuk menjawab pertanyaan User. Bila User menanyakan perjodohan maupun sifat seseorang yang aku tidak tahu datanya, aku akan meminta User untuk memasukan data pribadi yang diperlukan terlebih dahulu",

  "user_name": "User",
  "persona_name": "Sofia",

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
var userDayDetail = [];
var userPersonalData = {};

//<!-- FUNCTIONS -->
const docById = (id) => document.getElementById(id);
const docByClass = (className) => document.getElementsByClassName(className);

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


  if (fullName.length < 3 || birthYear < 4 || birthMonth == "00" || birthDate == "00") {
    alert("Data Invalid!");
    return;
  }

  const dateBirthStr = `${birthYear}-${birthMonth}-${birthDate}`
  const dateBirth = new Date(dateBirthStr);
  const dayDetail = klenik.PrimbonGetHariPasaran(dateBirth);
  const dayDetailPredictionPrimbon = klenik.PrimbonGetSifatElemenHariLahir(dayDetail[0]);

  let resultPrimbon =
`Profile Psikologi Primbon ${fullName}
Neptu Hari: ${dayDetail[0]}-${dayDetail[1]}
Neptu Pasaran: ${dayDetail[2]}-${dayDetail[3]}
Elemen Hari: ${dayDetailPredictionPrimbon.Nama}
Karakter Dasar: ${dayDetailPredictionPrimbon.Karakter}
Kelemahan: ${dayDetailPredictionPrimbon.Kelemahan}`;

  const dayDetailPredictionLifePath = klenik.NumerologyLifePathNumber(dateBirthStr);
  let resultLifePath =
`Profile Psikologi Jalur Hidup ${fullName}
Nama Jalur Hidup: ${dayDetailPredictionLifePath[1].Nama}
Karakter Dasar: ${dayDetailPredictionLifePath[1].Sifat}
Kelemahan: ${dayDetailPredictionLifePath[1].Kelemahan}
`;

  let result =
`[Data Diri ${fullName}]
Hari lahir: ${dayDetail[0]}, ${birthDate} ${dayDetail[4]}, ${birthYear}
${resultPrimbon}
${resultLifePath}`;

  //console.log(result)
  if (docById('dlg_header_get_person_data').innerHTML == "Data Saya") 
  {
    userDayDetail = dayDetail;
    userPersonalData.fullName = fullName;
    userPersonalData.birthday = dateBirthStr;
  
    const userMsg = `User:Nama lengkap saya: ${fullName}\nHari kelahiran saya: ${dateBirthStr}`
    const botMsg = `Sofia:Wahai Anaku, ${fullName}. Apa yang ingin engkau ketahui?`
    const newId = await conversationDB.AddDialog(userMsg, botMsg);
    await msgGetHistory();

    const kbTitle = `Profile Psikologi ${fullName}`
    const kbContent = result
    await vectorDB.IntegrateText(kbTitle, "", kbContent, false, 512, 0);
    await kbGetTitles();

    console.log(kbContent)
  }


  if (docById('dlg_header_get_person_data').innerHTML == "Data Orang Lain") {

    const userMsg = `User:Nama lengkap ${relation} saya: ${fullName}\nHari kelahiran ${relation} saya: ${dateBirthStr}`
    const botMsg = `Sofia:Wahai Anaku, apa yang ingin engkau ketahui mengenai si ${fullName}?`

    const newId = await conversationDB.AddDialog(userMsg, botMsg);
    await msgGetHistory();

    const kbTitle = `Profile Psikologi ${fullName}`
    const kbContent = `${result}Hubungan dengan User: ${relation}`
    await vectorDB.IntegrateText(kbTitle, "", kbContent, false, 512, 0);
    await kbGetTitles();
    console.log(kbContent);

    
    //const relationType=["istri","suami","pacar","pasangan","teman","kawan","atasan"];
    const relationType=["istri","suami","pacar","pasangan"];
    const relToUser = relation.toLowerCase();
    if(relationType.includes(relToUser))
    {
        let perjodohan = klenik.PrimbonGetPerJodohanHariLahir(
        [userDayDetail[1], userDayDetail[3]], 
        [dayDetail[1], dayDetail[3]]);
      
        const kbTitle = `Profile Perjodohan Primbon antara ${userPersonalData.fullName} dengan ${fullName}`
      
        const kbContent = 
        `[${kbTitle}]\nNama Perjodohan: ${perjodohan.Nama}\nPrediksi Perjodohan: ${perjodohan.Prediksi}`;

        await vectorDB.IntegrateText(kbTitle, "", kbContent, false, 512, 0);
        await kbGetTitles();
        

        console.log(perjodohan);
    }
    
    
  }

  
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

function renderJSONInputForm(divContainerId = "", formName = "", dataObject = {}) {
  // Get the container element to hold the form
  var formContainer = document.getElementById(divContainerId);

  const t_form =
    `<form id="form_${formName}">
        _CONTENT_
        </form>
      `;
  const t_input_textArea =
    `
        <div class="mb-3" style="color:white">
          <label for="_INPUT_NAME_" class="form-label">_INPUT_NAME_</label>
          <div class="">
            <textarea class="form-control" id="_INPUT_NAME_" rows="3">_VALUE_</textarea>
          </div>
        </div>
      `
    const t_input_text =
    `
        <div class="row mb-3" style="color:white">
          <label for="_INPUT_NAME_" class="form-label col-sm-5 col-form-label ">_INPUT_NAME_</label>
          <div class="col-sm-5">
            <input type="text" class="form-control" id="_INPUT_NAME_" value="_VALUE_">
          </div>
        </div>
      `
    var h_form_content = "";
  // Loop through each property in the dataObject
  for (var key in dataObject) {
    if (dataObject.hasOwnProperty(key)) {
      let data = dataObject[key];
      if (typeof data === 'string' || data instanceof String) {
        if (data.length > 20) {
          h_form_content += t_input_textArea
          .replaceAll("_INPUT_NAME_", key)
          .replaceAll("_VALUE_", data)
        } else {
          h_form_content += t_input_text
          .replaceAll("_INPUT_NAME_", key)
          .replaceAll("_VALUE_", data)
        }

      } else {
        h_form_content += t_input_text
        .replaceAll("_INPUT_NAME_", key)
        .replaceAll("_VALUE_", dataObject[key])
      }

    }
  }
  var h_form = t_form.replace("_CONTENT_", h_form_content);
  formContainer.innerHTML = h_form;
  //console.log(h_form)
}

function getJSONInputFormData(formName = "") {
  var formElement = document.getElementById(`form_${formName}`);
  var inputs = formElement.querySelectorAll("input[type='text'], textarea");
  var formData = {};

  inputs.forEach(function (input) {
    var key = input.id;
    var value = input.value;
    formData[key] = value;
  });

  return formData;
}

function scrollMessageToBottom() {
  var objDiv = docById('messages');
  objDiv.scrollTop = objDiv.scrollHeight;
}

async function load_user_idb() {
  const u_p = await idb.GetIDBObject("persona");
  if (u_p != null) {
    renderJSONInputForm("div_persona_brain_container", "persona_brain", u_p);
    persona = u_p
      //console.log(getJSONInputFormData("persona_brain"));

  } else {
    await idb.SaveIDBObject(persona)
    renderJSONInputForm("div_persona_brain_container", "persona_brain", persona);
  }

  const u_c = await idb.GetIDBObject("conversation");
  if (u_c != null) {
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
    await idb.SaveIDBObject(getJSONInputFormData("persona_brain"));
  } catch {
    alert("Invalid JSON Structure")
  }

}

function render_msg(data) {
  var message = JSON.parse(data);
  const rspMsgId = message.timestamp;

  const msgText = message.text
    .replaceAll("\"", "")
    .replaceAll(`${docById('user_name').value}:`, "")
    .replaceAll(`${docById('persona_name').value}:`, "")
    .replaceAll("\n", "<br>");

  let msg =
    `<div class="_MSG_CLASS_">
			<p id="_BOT_RSP_ID_">_MSG_TEXT_</p>
			<span class="_TIME_CLASS_">_TIMESTAMP_</span>
			</div>`

    let buttons = `<button id="btnDelete__BOT_RSP_ID_" title="Delete" onclick="click_delete_dialog('_DIALOG_ID_')">X</button>
			<button id="btnSpeak__BOT_RSP_ID_" title="Speak" onclick="speak('_BOT_RSP_ID_')">?</button>
      <button id="btnEdit__BOT_RSP_ID_" title="Edit" onclick="msgEdit('_DIALOG_ID_')">=</button>`

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

  return rspMsgId;
};

async function msgSend(input = "") {
  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);

  const userMsg = input == null ? '' : `${persona.user_name}:${input.trim()}`;
  const brain = getJSONInputFormData("persona_brain");

  let p_user = await conversationDB.ConstructQueryContext("CGPT", brain, userMsg, 10, [""], [""], 500, 500, 500, 0.1, 0.9, 0.8)
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
    msgGetHistory()
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
  util.saveAsFile(`ynbt-ai_agent-${util.GetTimeStamp()}.json`, obj, document);
}

async function click_delete_dialog(dialog_id) {
  const oaiKey = tb_oai_key.value;
  conversationDB.SetOpenAIApiKey(oaiKey);
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
  kbGetTitles();
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
  kbGetTitles();
}

async function kbGetTitles() {
  let vdb = vectorDB;
  let divDocTItles = docById('div_user_documents');
  let listDocTitles = await vdb.GetDocTitles(vdb.DATA_TYPE_KB);
  let docTitles = "";

  for (const e of listDocTitles) {
    docTitles += `<dt style="font-weight:inherit;"><button style="border:none;background-color:transparent;"onclick="kbDeleteItem('${e}')">X</button>${e}</dt>`
    //console.log(e)
  }

  docTitles = `<dl>${docTitles}</dl>`
    divDocTItles.innerHTML = docTitles;
}

//<!-- Layout -->
const isMobile = matchMedia("(max-width: 768px)").matches;
const persona_brain_size = isMobile ? 0 : 0;
const user_documents_size = isMobile ? 0 : 0;

//DOM finished loading
onload = async function () {
  await idb.DeleteIDB(); //CLEAR
  await load_user_idb();

  const dlg_info = docById('dlg_info');
  const tb_oai_key = docById('tb_oai_key');
  tb_oai_key.value = persona.tb_oai_key;
  const oaiKey = util.DecX(persona.tb_oai_key, dbName);
  conversationDB.SetOpenAIApiKey(oaiKey);
  vectorDB.SetOpenAIApiKey(oaiKey);

  docById('dlg_get_person_data').querySelectorAll('input').forEach(x => x.style.textAlign = "center");

  docById('btn_default_persona_brain').addEventListener('click', async function () {
    renderJSONInputForm("div_persona_brain_container", "persona_brain", persona);
  });
  docById('btn_save_persona_brain').addEventListener('click', async function () {
    update_user_persona();
  });
  docById('btn_export_persona_brain').addEventListener('click', async function () {
    const obj = await idb.GetIDBObject("persona");
    util.saveAsFile(`ynbt-ai_agent_brain-${util.GetTimeStamp()}.json`, obj, document);
  });

  docById('message-input').addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById('message-send').click();
    }
  });
  docById('message-send').addEventListener('click', async function () {
    await msgSend(docById('message-input').value)
    //console.log("btn_submit_persona_chat");
  });

  docById('btn_data_pasangan').addEventListener('click', async function () {
    open_get_person_data("Data Orang Lain");
  });


  docById('btn_user_kb_add').addEventListener('click', async function () {
    kb_input_title.value = "General Knowledge";
    kb_input_content.value = "";
    dlg_kb_input.showModal();
  });

  docById('btn_user_kb_get').addEventListener('click', async function () {
    const obj = await idb.GetIDBObject("knowledgebase");
    util.saveAsFile(`ynbt-ai_agent_kb-${util.GetTimeStamp()}.json`, obj, document);
  });

  docById('dlg_get_person_data_btn_submit').addEventListener('click', async function () {
    submit_get_person_data()
  });
  
  docById('dlg_get_person_data_btn_cancel').addEventListener('click', async function () {
    dlg_get_person_data.close('')
  });
  
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
  
  

  const dlg_kb_input = docById('dlg_kb_input');
  const kb_input_title = docById('kb_input_title');
  const kb_input_content = docById('kb_input_content');
  const kb_input_isGiantText = docById('kb_input_isGiantText');
  const kb_input_textchunker_chunkSize = docById('kb_input_textchunker_chunkSize');
  const kb_input_textchunker_chunkOverlap = docById('kb_input_textchunker_chunkOverlap');
  const kb_input_content_cancel = docById('kb_input_content_cancel');
  const kb_input_content_submit = docById('kb_input_content_submit');

  const dlg_lbl_edit_dialog_ta_user = docById('dlg_lbl_edit_dialog_ta_user');
  const dlg_edit_dialog_ta_user = docById('dlg_edit_dialog_ta_user');
  const dlg_lbl_edit_dialog_ta_persona = docById('dlg_lbl_edit_dialog_ta_persona');
  const dlg_edit_dialog_ta_persona = docById('dlg_edit_dialog_ta_persona');

  docById('div_help_greetings').innerHTML = persona.persona_greetings;
  let file_import_pdf = docById('file_import_pdf');
  file_import_pdf.addEventListener('change', kbImportPDF);

  const file_import_json = docById('file_import_json');
  file_import_json.addEventListener('change', importJSONData);

  open_get_person_data("Data Saya");

  if (isMobile) {
    // Mobile browser
    console.log("Mobile browser detected");
    //myLayout.getComponent('persona_brain').updateSize(0, 0)
  } else {
    // Desktop browser
    console.log("Desktop browser detected");
  }
};

// wait on voices to be loaded before fetching list
speechSynthesis.onvoiceschanged = function () {
  //listVoices();
  //speak("Engine On!!");
};