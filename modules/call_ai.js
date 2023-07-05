async function call_oai_completion(p_final="", oaiKey="", temperature=0.7,max_tokens=1024)
{
    if(oaiKey=="")
    {
        const msg = `[ERROR: OAI - API key is empty]`
        alert(msg);
        return msg;
    }

    try {
    const oaiPayload={
        model: "gpt-3.5-turbo",
        temperature: temperature,
        max_tokens: max_tokens,
        messages: [
            //{ role: "system", content: systemCmd},
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
        alert(msg);
        return msg;
    }
    else
    {
        const rsp = await response.json();
        const rspMsg = rsp.choices[0].message.content.trim()
        console.log(rspMsg)

        //console.log(rsp)

        alert("AI Generation Finished!");
        return rspMsg;
    }

    
    } catch (error) {
    
    console.log(error)
    const msg = `[ERROR: General - please check console]`
    alert(msg);
    
    return "[ERROR: General]"
    }
    
}