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
    async ConstructQueryContext(brainObj={},
        userMessage="userName:message",
        resecentDialogToInclude=0,
        userKBToInclude=[""], agenKBToInclude=[""], 
        maxUserKBTokens=500, maxAgentKBTokens=500, maxUserConvoTokens=500,
        minUserKBSimilarity=0.8,minAgentKBSimilarity=0.9,minConvoSimilarity=0.8
        )
    {
        var searchConvo = null;
        var searchUserKb = null;
        var p_context_kb = "===KNOWLEDGEBASE";
        var p_context_convo = "===PAST CONVERSATIONS";
        var p_context_instruct = "===INSTRUCTION";
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
                    userKBContext += `DateTime:${d_dt}\n${d.text}\n\n`;
                    if(util.GetTokenCount(userKBContext)>=maxUserKBTokens) break;
                }
            }
            
            if(userKBContext=="") userKBContext=`No knowledgebase found.\n`
        }
        

        var userConvoContext = "";
        if(maxUserConvoTokens>0)
        {
            //console.log(`${pathUserKnowledgeBase}--${userMessage}--${minUserKBSimilarity}`)
            searchConvo = await this.vdb.Search(VectorDB.DATA_TYPE_CONVO, userMsgVectors,userMessage,userKBToInclude,[""],minUserKBSimilarity,10);
            if(searchConvo!=null)
            {
                let converted = await this.ConvertVDBItemsToDialogs(searchConvo);
                for (const d of converted) {
                    const d_dt = util.GetDateFromTimeStamp(d[0]);
                    userConvoContext += `DateTime:${d_dt}\n${d[1]}\n${d[2]}\n\n`;
                    if(util.GetTokenCount(userConvoContext)>=maxUserConvoTokens) break;
                }
            }
            if(userConvoContext=="") userConvoContext=`No conversation found.\n`
        }

        var userRecentConvoContext = "";
        if(resecentDialogToInclude>0)
        {
            userRecentConvoContext = "";
        }

        const nowUTC= `DateTime:${util.GetNowUtcString()}`;
        const lastDialogs = `${nowUTC}\n${userMessage}\n${brainObj.persona_name}:`;
        const p_queryContext = 
`
${p_context_kb}
${userKBContext}
${p_context_convo}
${userConvoContext}
${p_context_instruct}
${brainObj.persona_info}${brainObj.persona_context}\n
${lastDialogs}`;
        //p_queryContext = `${userMessage}\n\n${botBrainObj.persona_info}\n\n${botBrainObj.name}:`;

        console.log(`[ ConstructQueryContext ]\n${p_queryContext}\n!!TokenCount:${util.GetTokenCount(p_queryContext)}`)
        return p_queryContext;
    }


}