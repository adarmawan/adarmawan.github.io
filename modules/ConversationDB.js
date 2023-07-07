"use strict";
//import { v4 as uuidv4 } from 'uuid';
//import * as fs from 'node:fs/promises';
import * as util from './utility.js';
import { VectorDB } from "./VectorDB.js"

export class ConversationDB 
{
    constructor(tfUSE)
    {
        this.tfUSE = tfUSE;
        this.vdb = new VectorDB();
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

    async NewConversation(data={userId:-1,botId:-1, convoId:-1}, convoTitle) 
    {
        //if(data.convoId==-1) data.convoId = util.GetTimeStamp(); //BUG: This dont work!!!
        const { pathUserInfo, pathUserBotBrain, pathUserBotChat }=util.getUserPaths(data);

        //console.log(data)
        const botBrainObj = JSON.parse(await fs.readFile(pathUserBotBrain, 'utf8'));
        const userInfoObj = JSON.parse(await fs.readFile(pathUserInfo, 'utf8'));
        
        const d_U = botBrainObj.sample_chat[0].replaceAll("U:", `${userInfoObj.userName}:`);
        const d_B = botBrainObj.sample_chat[1].replaceAll("B:", `${botBrainObj.name}:`);

        const rsp0 = await  this.vdb.NewKnowledgeBaseFile(pathUserBotChat);
        var chatObj = await  this.vdb.LoadKnowledgeBaseFile(pathUserBotChat);
        chatObj.references.push(convoTitle);

        await fs.writeFile(pathUserBotChat, JSON.stringify(chatObj, null, 2), 'utf8');
        const rsp1 = await  this.vdb.IntegrateDialog(this.tfUSE, pathUserBotChat, d_U, d_B);
        return chatObj;
    }

    async AddDialog(tfUSE, data={userId:-1,botId:-1, convoId:-1}, userMessage="", aiResponse="")
    {
        const { pathUserInfo, pathUserBotBrain, pathUserBotChat} = util.getUserPaths(data);

        const botBrainObj = JSON.parse(await fs.readFile(pathUserBotBrain, 'utf8'));
        const userInfoObj = JSON.parse(await fs.readFile(pathUserInfo, 'utf8'));

        const d_U = userMessage.replaceAll("U:", `${userInfoObj.userName}:`);
        const d_B = aiResponse.replaceAll("B:", `${botBrainObj.name}:`);

        const rsp1 = await this.vdb.IntegrateDialog(tfUSE, pathUserBotChat, d_U, d_B);
        return rsp1;
    }

    async UpdateDialog(data={userId:-1,botId:-1, convoId:-1, dialogId:-1}, userMessage="", aiResponse="")
    {
        const { pathUserInfo, pathUserBotBrain, pathUserBotChat} = util.getUserPaths(data);

        const botBrainObj = JSON.parse(await fs.readFile(pathUserBotBrain, 'utf8'));
        const userInfoObj = JSON.parse(await fs.readFile(pathUserInfo, 'utf8'));

        const d_U = userMessage.replaceAll("U:", `${userInfoObj.userName}:`);
        const d_B = aiResponse.replaceAll("B:", `${botBrainObj.name}:`);

        await this.vdb.UpdateDialog(this.tfUSE, pathUserBotChat, data.dialogId, d_U, d_B);
    }

    async DeleteDialog(data={userId:-1,botId:-1, convoId:-1, dialogId:-1})
    {
        const { pathUserInfo, pathUserBotBrain, pathUserBotChat} = util.getUserPaths(data);
        await this.vdb.DeleteItem(pathUserBotChat, data.dialogId);
    }

    async SearchDialog(tfUSE, data={userId:-1, botId:-1, convoId:-1, dialogId:-1}, userMessage="", sortByTimestamp=true, mustHaveSomeOfTheWords=false, minSimilarity=0.25, maxResult=10)
    {
        const { pathUserBotChat} = util.getUserPaths(data);
        let rsp0 = await this.vdb.Search(tfUSE,pathUserBotChat,userMessage,[""],[""],minSimilarity,maxResult);

        if(sortByTimestamp)
        {
            rsp0.sort(function (a, b) {
                return a.timestamp - b.timestamp;
            });
        }

        var dialogs = this.ConvertVDBItemsToDialogs(rsp0);
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
    async ConstructQueryContext(data={userId:-1,botId:-1, convoId:-1}, 
        userMessage="",
        resecentDialogToInclude=0,
        userKBToInclude=[""], agenKBToInclude=[""], 
        maxUserKBTokens=500, maxAgentKBTokens=500, maxUserConvoTokens=500,
        minUserKBSimilarity=0.25,minAgentKBSimilarity=0.25,minConvoSimilarity=0.25
        )
    {
        const { pathUserInfo, pathUserBotBrain, pathUserKnowledgeBase } = util.getUserPaths(data);
        const botBrainObj = JSON.parse(await fs.readFile(pathUserBotBrain, 'utf8'));
        const userInfoObj = JSON.parse(await fs.readFile(pathUserInfo, 'utf8'));

        var searchConvo = null;
        var searchUserKb = null;

        
        var p_queryContext = "KNOWLEDGE_CONTEXT:";
        var userKBContext = "";
        if(maxUserKBTokens>0)
        {
            //console.log(`${pathUserKnowledgeBase}--${userMessage}--${maxUserKBTokens}--${minUserKBSimilarity}`)
            searchUserKb = await this.vdb.Search(this.tfUSE, pathUserKnowledgeBase, userMessage,userKBToInclude,[""],minUserKBSimilarity,10);
            for (const d of searchUserKb) {
                userKBContext += `${d.text}\n`;
                if(util.GetTokenCount(userKBContext)>=maxUserKBTokens) break;
            }
            if(userKBContext=="") userKBContext=`No data found.\n`
        }
        
        var userConvoContext = "";
        if(maxUserConvoTokens>0)
        {
            //console.log(`${pathUserKnowledgeBase}--${userMessage}--${minUserKBSimilarity}`)
            searchConvo = await this.SearchDialog(this.tfUSE, data, userMessage,true,false,minConvoSimilarity,10);
            for (const d of searchConvo) {
                userConvoContext += `${d[1]}\n${d[2]}\n`;
                if(util.GetTokenCount(userConvoContext)>=maxUserConvoTokens) break;
            }
            if(userConvoContext=="") userConvoContext=`No data found.\n`
        }

        var userRecentConvoContext = "";
        if(resecentDialogToInclude>0)
        {
            userRecentConvoContext = "";
        }

        
        const lastDialogs = `${userInfoObj.userName}:${userMessage}\n${botBrainObj.name}:`;
        p_queryContext = `${p_queryContext}\n${userKBContext}${userConvoContext}\n${botBrainObj.persona_info}\n\n${lastDialogs}`;
        //p_queryContext = `${userMessage}\n\n${botBrainObj.persona_info}\n\n${botBrainObj.name}:`;

        console.log(`[ ConstructQueryContext ]\n${p_queryContext}\n!!TokenCount:${util.GetTokenCount(p_queryContext)}`)
        return p_queryContext;
    }


    async GetConversationObject(convoFilePath)
    {
        return await this.vdb.LoadKnowledgeBaseFile(convoFilePath);
    }

    async GetTitle(convoFilePath)
    {
        return (await this.vdb.LoadKnowledgeBaseFile(convoFilePath)).references[0];
    }
    async SetTitle(convoFilePath="", newTitle="")
    {
        let cvdObj = await this.vdb.LoadKnowledgeBaseFile(convoFilePath);
        cvdObj.references[0] = newTitle;
        await fs.writeFile(convoFilePath, JSON.stringify(cvdObj, null, 2), 'utf8');
    }

    async GetHistory(data={userId:-1,botId:-1, convoId:-1}, maxResult=10)
    {
        const { pathUserBotChat } = util.getUserPaths(data);
        const rsp0 = await this.vdb.GetLatest(pathUserBotChat, maxResult);

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

}