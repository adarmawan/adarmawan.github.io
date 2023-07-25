/*
OAI Chat Result Structure:
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "\n\nHello there, how may I assist you today?",
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
*/
export async function call_oai_completion(p_system, p_final="", oaiKey="", temperature=1,max_tokens=1024)
{

    if(oaiKey=="")
    {
        const msg = `[ERROR: OAI - API key is empty]`
        alert(msg);
        return msg;
    }

    try 
    {
    const oaiPayload={
        model: "gpt-3.5-turbo",
        temperature: temperature,
        max_tokens: max_tokens,
        messages: [
            { role: "system", content: p_system},
            { role: "user", content: p_final }
        ],
    };
    //console.log(oaiPayload);return "[ERROR:]";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization':`Bearer ${oaiKey}`
    },
    body: JSON.stringify(oaiPayload)
    })

    if(response.status!=200)
    {
        const msg = `[ERROR: OAI - ${response.status}]`
        //alert(msg);
        return msg;
    }
    else
    {
        const rsp = await response.json();
        const rspMsg = rsp.choices[0].message.content.trim()
        console.log(rspMsg)

        //console.log(rsp)

        //alert("AI Generation Finished!");
        return rspMsg;
    }

    
    } catch (error) {
    
    console.log(error)
    const msg = `[ERROR: General - please check console]`
    //alert(msg);
    
    return msg
    }
    
}

/*
OAI Embeddings Result Structure:
{
    "object": "list",
    "data": [
        {
        "object": "embedding",
        "embedding": [
            0.0023064255,
            -0.009327292,
            .... (1536 floats total for ada-002)
            -0.0028842222,
        ],
        "index": 0
        }
    ],
    "model": "text-embedding-ada-002",
    "usage": {
        "prompt_tokens": 8,
        "total_tokens": 8
    }
}
*/
export async function call_oai_embedding(p_final, oaiKey="")
{
    if(oaiKey=="")
    {
        const msg = `[ERROR: OAI - API key is empty]`
        alert(msg);
        return msg;
    }

    try 
    {
    const oaiPayload={
        model: "text-embedding-ada-002",
        input: p_final
    };
    //console.log(oaiPayload);return "[ERROR:]";

    const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization':`Bearer ${oaiKey}`
    },
    body: JSON.stringify(oaiPayload)
    })

    if(response.status!=200)
    {
        const msg = `[ERROR: OAI - ${response.status}]`
        alert(msg);
        return msg;
    }
    else
    {
        const rsp = await response.json();
        const rspMsg = rsp.data;
        //console.log(rspMsg)
        return rspMsg;
    }

    
    } catch (error) {
    
    console.log(error)
    const msg = `[ERROR: General - please check console]`
    alert(msg);
    
    return "[ERROR: General]"
    }
}

/*
*/
export async function call_ll2_completion(p_final="", p_stop=["</s>"], stream=true, aiAnswerTextArea=null, temperature=0.5,max_tokens=1024)
{
    var payload={
        "stream":stream,
        "n_keep":0,
        "n_predict":max_tokens,
        "temperature":temperature,
        "repeat_last_n": 64,
        "repeat_penalty": 1.1,
        "top_k": 40,
        "top_p": 0.9,
        "stop":p_stop,
        "prompt":p_final};

    
    console.log(payload);

    try 
    {
        //console.log(payload);return "[ERROR:]";

        const response = await fetch('http://localhost:8080/completion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
        })

        if(response.status!=200)
        {
            const msg = `[ERROR: OAI - ${response.status}]`
            //alert(msg);
            return msg;
        }
        else
        {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let rspMsg = "";
 
            while (true) {
                const result = await reader.read()
                if (result.done) {
                    break;
                }

                let text = (decoder.decode(result.value)).replace("data: ","");
                //console.log(text)
                const jObj = JSON.parse(text);
                //console.log(jObj)

                // Process the current chunk of data
                rspMsg += jObj.content;
                aiAnswerTextArea.textContent += jObj.content;
            }


            return rspMsg;
        }

    
    } catch (error) {
    
        console.log(error)
        const msg = `[ERROR: General - please check console]`
        //alert(msg);
        
        return msg
    }
}