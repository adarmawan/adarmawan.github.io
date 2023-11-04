const T_INPUT_HEADER = `<label id="dlg_lbl_DLG_NAME_INPUT_NAME" for="dlg_DLG_NAME_INPUT_NAME">INPUT_NAME</label>\n`
const T_INPUT_TA = `<textarea type="text" id="dlg_DLG_NAME_INPUT_NAME" rows="5" style="width:50vw;"></textarea>\n`
const T_INPUT_TB = `<input type="text" id="dlg_DLG_NAME_INPUT_NAME" style="width:50vw;">\n`
const T_INPUT_TN = `<input type="number" id="dlg_DLG_NAME_INPUT_NAME" min="1" max="3000" style="width:50vw;">\n`

const T_DLG = `===HTML===
<dialog id="dlg_DLG_NAME">
    <form method="dialog" style="width: 50vw;">
      _DLG_INPUT_ELEMENTS_ 
      <div>
        <button id="dlg_DLG_NAME_btn_cancel" type="reset" onclick="dlg_DLG_NAME.close('')">Cancel</button>
        <button id="dlg_DLG_NAME_btn_submit" type="submit" onclick="submit_DLG_NAME()">Submit</button>
      </div>
    </form>
  </dialog>
`

//const T_JS_GET_INPUT_ELEMENT=`\tconst dlg_lbl_DLG_NAME_INPUT_NAME = document.getElementById('dlg_lbl_DLG_NAME_INPUT_NAME');\n\tconst dlg_DLG_NAME_INPUT_NAME = document.getElementById('dlg_DLG_NAME_INPUT_NAME');\n`;
const T_JS_GET_INPUT_ELEMENT=`  const dlg_lbl_DLG_NAME_INPUT_NAME = document.getElementById('dlg_lbl_DLG_NAME_INPUT_NAME');\n  const dlg_DLG_NAME_INPUT_NAME = document.getElementById('dlg_DLG_NAME_INPUT_NAME');\n`;

const T_FUNCTION = `
===JAVASCRIPT===
function open_DLG_NAME()
{
_FUNCTION_GET_INPUT_ELEMENT_
}

function submit_DLG_NAME()
{
_FUNCTION_GET_INPUT_ELEMENT_

  dlg_DLG_NAME.close('')
}
`

function renderDialog(data)
{
  let dlg = T_DLG.replaceAll("DLG_NAME", data.dlgName);
  let func = T_FUNCTION.replaceAll("DLG_NAME", data.dlgName);
  let inputs = "";
  let jsInputs = "";
  
  data.dlgInputs.forEach(el=>{
    inputs += T_INPUT_HEADER.replaceAll("DLG_NAME", data.dlgName).replaceAll("INPUT_NAME", el.name);

    if(el.name.startsWith("ta_"))
      inputs += T_INPUT_TA.replaceAll("DLG_NAME", data.dlgName).replaceAll("INPUT_NAME", el.name);
    if(el.name.startsWith("tb_"))
      inputs += T_INPUT_TB.replaceAll("DLG_NAME", data.dlgName).replaceAll("INPUT_NAME", el.name);
    if(el.name.startsWith("tn_"))
      inputs += T_INPUT_TN.replaceAll("DLG_NAME", data.dlgName).replaceAll("INPUT_NAME", el.name);
    
    jsInputs += T_JS_GET_INPUT_ELEMENT.replaceAll("DLG_NAME", data.dlgName).replaceAll("INPUT_NAME", el.name);
  })

  dlg = dlg.replaceAll("_DLG_INPUT_ELEMENTS_", inputs);
  func = func.replaceAll("_FUNCTION_GET_INPUT_ELEMENT_", jsInputs);

  return dlg+func;
}

const d_Test_01 = {
  dlgName:'get_person_data', 
  dlgInputs:[
    {name:"tb_fullName"},
    {name:"tn_birthYear"}, 
    {name:"tn_birthMonth"},
    {name:"tn_birthDate"}, 
  ]}
console.log(renderDialog(d_Test_01))