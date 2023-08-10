"use strict";

import * as util from './utility.js';
import { VectorDB } from "./VectorDB.js"

export class ConversationDB 
{
    constructor(oaiKey="OpenAI API Key")
    {
        this.oaiKey = oaiKey;
        this.vdb = new VectorDB();
    }
    
    SetOpenAIApiKey(oaiKey="OpenAI API Key") {
        this.oaiKey = oaiKey;
        this.vdb.SetOpenAIApiKey(oaiKey);
    }

    NewDialog(userInput, aiResponse) {
        var now = util.GetTimeStamp();
        var newDialog = [
            now,
            `U:${userInput}`,
            `B:${aiResponse}`,
            ''
        ];

        return newDialog;
    }

    async AddDialog(userMessage="userName:message", aiResponse="botName:message")
    {
        //console.log("AddDialog")
        const rsp1 = await this.vdb.IntegrateDialog(userMessage, aiResponse);
        //console.log(rsp1)
        return rsp1;
    }

    async UpdateDialog(itemCode="xxxx", userMessage="userName:message", aiResponse="botName:message")
    {
        await this.vdb.UpdateDialog(itemCode,userMessage,aiResponse);
    }

    async DeleteDialog(itemCode="xxxx")
    {
        await this.vdb.DeleteItem(VectorDB.DATA_TYPE_CONVO, itemCode);
    }

    async GetConversationObject()
    {
        return await this.vdb.LoadKnowledgeBaseFile(VectorDB.DATA_TYPE_CONVO);
    }

    async GetHistory(maxResult=10)
    {
        const rsp0 = await this.vdb.GetLatest(VectorDB.DATA_TYPE_CONVO, maxResult);

        var dialogs = this.ConvertVDBItemsToDialogs(rsp0);
        return dialogs;
    }

    async GetDialog(id="dialog GUID")
    {
        const vdbItems = await this.vdb.GetItem(VectorDB.DATA_TYPE_CONVO,id);
        //console.log(vdbItems)
        if(vdbItems.length>0)
        {
            const dlgs = await this.ConvertVDBItemsToDialogs(vdbItems);
            //console.log(dlgs)
            return dlgs[0] ;
        }

        return null;
    }
    async ConvertVDBItemsToDialogs(vdbItems=[])
    {
        var dialogs = [];
        for (const item of vdbItems) {
            const dlg = item.text.split(VectorDB.DIALOG_TEXT_SEPERATOR)
            dialogs.push([
             item.timestamp, dlg[0],dlg[1], item.id
            ])
        }

        return dialogs;
    }


    /*
    !!! Structure of Query Context !!!

    [Related knowledge and dialogs]
    KNOWLEDGE_CONTEXT:
    Related_kb_item_0: xxxx xxxx xxxx |
    Related_kb_item_1: xxxx xxxx xxxx ---> These are HIGHEST similarity first
    Related_dialog_pair_0: {user:messages, bot:response} |
    Related_dialog_pair_1: {user:messages, bot:response} ---> These are LOWEST timeStamp first
    IF no data is found --> `No data found.\n`

    
    [Persona BRAIN definition paragraph]
    + Personality profile.
    + Tasks in life.
    ? Basic user info.
    ? RailGuard : "Only use the KNOWLEDGE_CONTEXT to answers question from {user_name}"
    

    [Context for follow-up user query, such as "explain 'THAT' fact better".  These are LOWEST timeStamp first]
    Last_X_dialog_pairs:[{user:messages, bot:response}]
    [Bot dialog conditioning]
    + Current_dialog_pair_0: {user:messages, bot:???}

    */
    async ConstructQueryContext(promptTemplateName="CGPT", brainObj={},
        userMessage="userName:message",
        recentDialogToInclude=0,
        userKBToInclude=[""], agenKBToInclude=[""], 
        maxUserKBTokens=500, maxAgentKBTokens=500, maxUserConvoTokens=500,
        minUserKBSimilarity=0.8,minAgentKBSimilarity=0.9,minConvoSimilarity=0.8
        )
    {
        
        const LLMPromptTemplate=
        [
            {
                "name": "CGPT",
                "template": "_LABLE_USER_KB_\n_RELEVANT_USER_KB_\n_LABLE_PAST_USER_CONVO_\n_RELEVANT_PAST_USER_CONVO_\n_LABLE_INSTRUCTION_\n_PERSONA_INFO__PERSONA_CONTEXT__CURRENT_DATETIME_\n_LAST_USER_CONVO_",
                "switches": {dialog_include_timestamp:true}
            },
            {
                "name":"LL2_CHAT_1",
                "template":"[INST] <<SYS>>\n_PERSONA_INFO__PERSONA_CONTEXT__CURRENT_DATETIME_\n_RELEVANT_USER_KB_\n<</SYS>>\n\n_RELEVANT_PAST_USER_CONVO__LAST_USER_CONVO_ [/INST]",
                "switches": {dialog_include_timestamp:false}
            },
        ];
        var p_queryContext = "";
        var p_q_o = LLMPromptTemplate.filter(x=>x.name==promptTemplateName);
        if(p_q_o==null) return "[ERROR]";
        else p_queryContext = p_q_o[0].template;
        
        
        var combinedUserConvo = [];
        var latestUserConvo = null;
        var searchUserConvo = null;
        var searchUserKb = null;
        var _LABLE_USER_KB_ = "===KNOWLEDGEBASE";
        var _LABLE_PAST_USER_CONVO_ = "===PAST CONVERSATIONS";
        var _LABLE_INSTRUCTION_ = "===INSTRUCTION";
        const userMsgVectors = await this.vdb.GetSentenceVectors(userMessage);

        var userKBContext = "";
        if(maxUserKBTokens>0)
        {
            //console.log(`${pathUserKnowledgeBase}--${userMessage}--${maxUserKBTokens}--${minUserKBSimilarity}`)
            searchUserKb = await this.vdb.Search(VectorDB.DATA_TYPE_KB, userMsgVectors,userMessage,userKBToInclude,[""],minUserKBSimilarity,10);


            if(searchUserKb!=null)
            {
                for (const d of searchUserKb) {
                    const d_dt = util.GetDateFromTimeStamp(d.timestamp);
                    //userKBContext += `DateTime:${d_dt}\n${d.text}\n\n`;
                    userKBContext += `${d.text}\n`;
                    if(util.GetTokenCount(userKBContext)>=maxUserKBTokens) break;
                }
            }
            
            userKBContext = userKBContext.trim();
            //if(userKBContext=="") userKBContext=`No knowledgebase found.\n`
        }
        
        let userConvoItemsId = [];
        var userConvoContext = "";
        if(recentDialogToInclude>0)
        {
            latestUserConvo = await this.vdb.GetLatest(VectorDB.DATA_TYPE_CONVO, recentDialogToInclude);
            if(latestUserConvo!=null)
            {
                let converted = await this.ConvertVDBItemsToDialogs(latestUserConvo);
                for (const d of converted) {
                    userConvoItemsId.push(d[0]);
                    combinedUserConvo.push(d);
                }
            }
        }
        if(maxUserConvoTokens>0) 
        {
            //console.log(`${pathUserKnowledgeBase}--${userMessage}--${minUserKBSimilarity}`)
            searchUserConvo = await this.vdb.Search(VectorDB.DATA_TYPE_CONVO, userMsgVectors, userMessage, userKBToInclude, [""], minUserKBSimilarity, 10);
            if (searchUserConvo != null) {
                let converted = await this.ConvertVDBItemsToDialogs(searchUserConvo);
                for (const d of converted) {
                    if (userConvoItemsId.find(x => x == d[0]) == null) {
                        combinedUserConvo.push(d);
                        console.log(d[0]);
                    }
                }
            }
        }

        combinedUserConvo.sort(function (a, b) {
            return a[0] - b[0];
        });
        for (const d of combinedUserConvo) 
        {
            const d_dt = util.GetDateFromTimeStamp(d[0]);
            if(p_q_o[0].switches.dialog_include_timestamp)
                userConvoContext += `DateTime:${d_dt}\n${d[1]}\n${d[2]}\n\n`; //LLama2 gak bisa begini
            else
                userConvoContext += `${d[1]}\n${d[2]}\n\n`;
        }


        const nowUTC = util.GetNowUtcString();
        const currentDateTime = `Current date and time is ${nowUTC}` ;
        var lastDialogs = "";
        if(p_q_o[0].switches.dialog_include_timestamp)
            lastDialogs = `DateTime:${nowUTC}\n${userMessage}\n${brainObj.persona_name}:`;
        else
            lastDialogs = `${userMessage}\n${brainObj.persona_name}:`;
        
        p_queryContext = p_queryContext
                        .replace("_LABLE_USER_KB_", _LABLE_USER_KB_)
                        .replace("_RELEVANT_USER_KB_", userKBContext)
                        .replace("_LABLE_PAST_USER_CONVO_", _LABLE_PAST_USER_CONVO_)
                        .replace("_RELEVANT_PAST_USER_CONVO_", userConvoContext)
                        .replace("_LABLE_INSTRUCTION_", _LABLE_INSTRUCTION_)
                        .replace("_PERSONA_INFO_", brainObj.persona_info)
                        .replace("_PERSONA_CONTEXT_", brainObj.persona_context)
                        .replace("_CURRENT_DATETIME_", currentDateTime)
                        .replace("_LAST_USER_CONVO_", lastDialogs)

        return p_queryContext;
    }


}