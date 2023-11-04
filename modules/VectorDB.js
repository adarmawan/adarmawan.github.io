"use strict";

import * as util from './utility.js';
import * as math from './math.js'
import * as oai from './call_ai.js';
import * as idb from './IndexDB.js'

const MAX_CHUNK_TOKENS = 256
const OVERLAP_CHUNK_TOKENS = 5
const MAX_SEARCH_RESULT_TOKENS = 2000

export class VectorDB {
    static DIALOG_TEXT_SEPERATOR = "<|D|>";
    static DATA_TYPE_KB = "knowledgebase";
    static DATA_TYPE_CONVO = "conversation";

    constructor(oaiKey="OpenAI API Key") {
        this.oaiKey = oaiKey;
    }

    SetOpenAIApiKey(oaiKey="OpenAI API Key") {
        this.oaiKey = oaiKey;
    }

    NewKnowledgeBaseObject(dataType=VectorDB.DATA_TYPE_KB) {
        return {
            dataType: dataType, //conversation OR knowledgebase
            references: [""],
            textChunks: [
                {
                    timestamp: 1682498741,
                    id: "tc00-tc00-tc00-tc00",
                    title: "doc source title",
                    keyConcepts: ["concept_1"],
                    //textFull:"real text",
                    //text:"summary text",
                    text: "some text",
                    vectors: [0, 0, 0, 0]
                }
            ]

        }
    }

    
    /* DB Persistent BackEnd */
    async _saveVDBObject(vdbObj) {
        return idb.SaveIDBObject(vdbObj);
    }
    async _getVDBObject(dataType) {
        return idb.GetIDBObject(dataType);
    }
   

    RecursiveChunkerWord(chunk_size, overlap_size, text) 
    {
        let chunks = [];

        // Base case: If the text contains fewer or equal number of words than the chunk size, return the text as a single chunk
        const words = text.trim().split(/\s+/);
        if (words.length <= chunk_size) {
            return [text];
        }

        // Calculate the step size for chunking (chunk_size - overlap_size)
        const stepSize = chunk_size - overlap_size;

        // Split the words into overlapping chunks based on the desired chunk size and overlap
        let startIndex = 0;
        while (startIndex < words.length) {
            const currentWords = words.slice(startIndex, startIndex + chunk_size);
            const currentChunk = currentWords.join(' ');
            chunks.push(currentChunk);

            startIndex += stepSize;
        }

        // Recursively call function on the remaining text
        const remainingText = words.slice(startIndex).join(' ');
        const subChunks = this.RecursiveChunkerWord(chunk_size, overlap_size, remainingText);

        return chunks.concat(subChunks);
    }
    
    async GetSentenceVectors(sentence="")
    {
        const vectors = (await oai.call_oai_embedding(sentence, this.oaiKey))[0].embedding;
        return vectors
    }
    async NewKnowledgeBaseItemObjectWithSummary(oaiKey, title = "", keyConcepts = "", textChunk = "", textChunkSummary = "") {
        const id = util.GetGUIDV4()
        textChunk = textChunk.trim()
        textChunkSummary = textChunkSummary.trim()
        const vectors = await this.GetSentenceVectors(textChunk);

        var arrConcepts = keyConcepts.toLowerCase().split(',')
        return { id: id, timestamp: util.GetTimeStamp(), title: title, keyConcepts: arrConcepts, textFull: textChunk, text: textChunkSummary, vectors: vectors }
    }

    async NewKnowledgeBaseItemObject(title = "", keyConcepts = "", textChunk = "") {
        const id = util.GetGUIDV4();
        const text = `${textChunk.trim()}`;
        const vectors = await this.GetSentenceVectors(textChunk);
        var arrConcepts = keyConcepts.toLowerCase().split(',');
        arrConcepts = arrConcepts.map(x => x.trim());
        return { id: id, timestamp: util.GetTimeStamp(), title: title, keyConcepts: arrConcepts, text: text, vectors: vectors };
    }


    async LoadKnowledgeBaseFile(dataType=VectorDB.DATA_TYPE_KB) {
        try {
            var userKnowledgeBaseObj = this.NewKnowledgeBaseObject(dataType);
            userKnowledgeBaseObj = await this._getVDBObject(dataType);
            return userKnowledgeBaseObj;
        } catch (error) {
            console.log(error)
            return null
        }
    }

   
    async IntegrateDialog(userMessage="", aiResponse="")
    {
        try {
            const title = "dialog";
            const keyConcepts = "";

            var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(VectorDB.DATA_TYPE_CONVO)
        
            const textChunkForVector = `${userMessage}\n${aiResponse}`;
            const textChunk = `${userMessage}${VectorDB.DIALOG_TEXT_SEPERATOR}${aiResponse}`;
            
            var q = await this.NewKnowledgeBaseItemObject(title, keyConcepts, textChunkForVector);
            q.text = textChunk;
            userKnowledgeBaseObj.textChunks.push(q)
            
            await this._saveVDBObject(userKnowledgeBaseObj);
            
            return q.id;
        } catch (error) {
            console.log(error)
            return -1
        }
        
    }

    async UpdateDialog(itemCode="", userMessage="", aiResponse="")
    {
        try 
        {
            var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(VectorDB.DATA_TYPE_CONVO)

            const itemIdx = userKnowledgeBaseObj.textChunks.findIndex(x => x.id == itemCode)
            if (itemIdx > -1) 
            {
                const textChunkForVector = `${userMessage}\n${aiResponse}`;
                const textChunk = `${userMessage}${VectorDB.DIALOG_TEXT_SEPERATOR}${aiResponse}`;

                userKnowledgeBaseObj.textChunks[itemIdx].text = textChunk;
                userKnowledgeBaseObj.textChunks[itemIdx].vectors = await this.GetSentenceVectors(textChunkForVector);

                await this._saveVDBObject(userKnowledgeBaseObj);
            }

            return itemIdx;
        } catch (error) {
            return -1
        }
        
    }

    async EditItem(dataType=VectorDB.DATA_TYPE_KB, itemCode="", textChunk="")
    {
        try 
        {
            var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);

            const itemIdx = userKnowledgeBaseObj.textChunks.findIndex(x => x.id == itemCode);
            if (itemIdx > -1) 
            {
                userKnowledgeBaseObj.textChunks[itemIdx].text = textChunk;
                userKnowledgeBaseObj.textChunks[itemIdx].vectors = await this.GetSentenceVectors(textChunk);
                
                await this._saveVDBObject(userKnowledgeBaseObj);
            }

            return itemIdx;
        } catch (error) {
            return -1
        }
        
    }


    async IntegrateText(title = "", keyConcepts = "", text = "", isGiantText = true, chunk_size=MAX_CHUNK_TOKENS, overlap_size=OVERLAP_CHUNK_TOKENS) {
        var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(VectorDB.DATA_TYPE_KB)

        if (userKnowledgeBaseObj.references.indexOf(title) == -1)
            userKnowledgeBaseObj.references.push(title)


        let newText = text;
        let cleanSentenceArray = [newText];

        if (isGiantText) {
            newText = util.CombinedParagraphs(text)
            newText = util.CleanNumbersInsideBrackets(newText)
            newText = util.CombinedWhitespaces(newText)
            newText = util.CombinedPeriods(newText)
            console.log(`IntegrateText - TextContent Tokens: ${util.GetTokenCount(newText)}`)

            chunk_size = Number(chunk_size);
            overlap_size = Number(overlap_size);
            cleanSentenceArray = this.RecursiveChunkerWord(chunk_size, overlap_size, newText);
            // Remove empty or falsy values from the array
            cleanSentenceArray = cleanSentenceArray.filter(function (item) {
                return item; // returns true for non-empty or truthy values, false for empty or falsy values
            });

            
            for (const sen of cleanSentenceArray) {
                const q = await this.NewKnowledgeBaseItemObject(title, keyConcepts, sen)
                userKnowledgeBaseObj.textChunks.push(q)

            }

            await this._saveVDBObject(userKnowledgeBaseObj)

            return cleanSentenceArray.length
        }
        else {
            console.log(`IntegrateText - TextContent Tokens: ${util.GetTokenCount(newText)}`)
            const q = await this.NewKnowledgeBaseItemObject(title, keyConcepts, newText)
            userKnowledgeBaseObj.textChunks.push(q)

            await this._saveVDBObject(userKnowledgeBaseObj)

            return 1
        }
    }


    async SearchMemory(dataType=VectorDB.DATA_TYPE_KB, kb_object={}, userMsgVectors=[], userInput = "", docTitles = [""], keyConcepts = [""], minSimilarityValue = 0.2, maxResult = 10)
    {
        try {
            var userKnowledgeBaseObj = kb_object
            
            const vTest = userMsgVectors;
            var simTest = []

            var finalKB = this.NewKnowledgeBaseObject(dataType)
            finalKB.references = []
            finalKB.textChunks = []

            if (docTitles[0] != "") {
                finalKB.textChunks = userKnowledgeBaseObj.textChunks.filter(x => docTitles.includes(x.title))
            }
            else {
                finalKB.textChunks = userKnowledgeBaseObj.textChunks.slice()
            }

            
            for (var tc of finalKB.textChunks)
            {
                try
                {
                    const val = math.SimilarityVector(vTest, tc.vectors)
                    var resObj =
                    {
                        timestamp: tc.timestamp,
                        id: tc.id,
                        title: tc.title,
                        keyConcepts: tc.keyConcepts,
                        text: tc.text,
                        fullText: tc.fullText,
                        val: val
                    }

                    if (val >= minSimilarityValue)
                        simTest.push(resObj)

                }catch{} //handle invalid entries caused by vector errors
            }
            //SORT HIGH similarity first
            simTest.sort(function (a, b) {
                return b.val - a.val;
            });


            const simTestTop = simTest.slice(0, maxResult); //Start Index-0
            const debugArray = simTestTop.map(item => ({ id: item.id, val: item.val }));
            //const debugArray = simTestTop.map(item => [item.id, item.val]);
            console.log(debugArray)
            return simTestTop
        }
        catch (err) {
            console.log(`[ VDB ERROR ]\nJSON_OBJ\n${userInput}\n${docTitles}`)
            console.log(userKnowledgeBaseObj)
            console.log(err)
            return [];
        }
    }


    async Search(dataType=VectorDB.DATA_TYPE_KB, userMsgVectors=[], userInput = "", docTitles = [""], keyConcepts = [""], minSimilarityValue = 0.2, maxResult = 10) 
    {
        //console.log(docTitles)
        //console.log(keyConcepts)

        try {
            var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType)
            
            const vTest = userMsgVectors;
            var simTest = []

            var finalKB = this.NewKnowledgeBaseObject(dataType)
            finalKB.references = []
            finalKB.textChunks = []

            if (docTitles[0] != "") {
                finalKB.textChunks = userKnowledgeBaseObj.textChunks.filter(x => docTitles.includes(x.title))
            }
            else {
                finalKB.textChunks = userKnowledgeBaseObj.textChunks.slice()
            }

            
            for (var tc of finalKB.textChunks)
            {
                try
                {
                    const val = math.SimilarityVector(vTest, tc.vectors)
                    var resObj =
                    {
                        timestamp: tc.timestamp,
                        id: tc.id,
                        title: tc.title,
                        keyConcepts: tc.keyConcepts,
                        text: tc.text,
                        val: val
                    }

                    if (val >= minSimilarityValue)
                        simTest.push(resObj)

                }catch{} //handle invalid entries caused by vector errors
            }
            //SORT HIGH similarity first
            simTest.sort(function (a, b) {
                return b.val - a.val;
            });


            const simTestTop = simTest.slice(0, maxResult); //Start Index-0
            const debugArray = simTestTop.map(item => ({ id: item.id, val: item.val }));
            //const debugArray = simTestTop.map(item => [item.id, item.val]);
            console.log(debugArray)
            return simTestTop
        }
        catch (err) {
            console.log(`[ VDB ERROR ]\n${dataType}\n${userInput}\n${docTitles}`)
            console.log(userKnowledgeBaseObj)
            console.log(err)
            return [];
        }
    }


    async GetItem(dataType=VectorDB.DATA_TYPE_KB, itemId="item guid")
    {
        const userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);
        return userKnowledgeBaseObj.textChunks.filter(x=>x.id==itemId);
    }


    async GetLatest(dataType=VectorDB.DATA_TYPE_KB, maxResult = 10)
    {
        const userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);

        return userKnowledgeBaseObj.textChunks.slice(-maxResult)
    }

    async DeleteItem(dataType=VectorDB.DATA_TYPE_KB, itemCode = "") {
        var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);
        userKnowledgeBaseObj.textChunks = userKnowledgeBaseObj.textChunks.filter(x=>x.id!=itemCode)
        await this._saveVDBObject(userKnowledgeBaseObj);
    }

    async DeleteTitle(dataType=VectorDB.DATA_TYPE_KB, docTitle = "") {
        var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);
        docTitle = docTitle.toLowerCase();
        userKnowledgeBaseObj.textChunks = userKnowledgeBaseObj.textChunks.filter(x=>x.title.toLowerCase()!=docTitle)
        userKnowledgeBaseObj.references = userKnowledgeBaseObj.references.filter(x=>x.toLowerCase()!=docTitle)
        await this._saveVDBObject(userKnowledgeBaseObj);
    }

    async GetKeyConcepts(dataType=VectorDB.DATA_TYPE_KB) {
        var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);

        const kc = new Set()
        for (const item of userKnowledgeBaseObj.textChunks) {
            for (const concept of item.keyConcepts) {
                kc.add(concept.trim().toLowerCase())
            }

        }
        var kcSetArray = [...kc]
        return kcSetArray
    }

    async GetDocTitles(dataType=VectorDB.DATA_TYPE_KB) {
        var userKnowledgeBaseObj = await this.LoadKnowledgeBaseFile(dataType);
        return userKnowledgeBaseObj.references;
    }

}