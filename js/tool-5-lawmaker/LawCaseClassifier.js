//import * as util from '../../modules/utility.js';

const INSTRUCTION_1 =  `Please deeply analyze all the data above and fill out this form. Don't write anything else:`
const INSTRUCTION_2 =  
`Rules to follow:
- Kidnaping is NOT theft or robbery.
- Self defence can not be charged for anything.
- Every Pelaku Pidana should also be charged by Pasal 55 (Pelaku Pidana dan Penganjur dalam Hukum Pidana) 

Fill out this form according to the rules. Don't write anything else:
`

const QUESTIONER_DATA = 
[
  {
    "Question": "Involving sexual assault: Yes or No",
    "RelatedPasal": ["285","289","290","291","294","295","336"]
  },
  {
    "Question": "Involving kidnapping: Yes or No",
    "RelatedPasal": ["328"]
  },
  {
    "Question__": "Involving theft or robbery (does not include kidnapping): Yes or No",
    "Question": "Involving theft or robbery: Yes or No",
    "RelatedPasal": ["362","363","364","365"]
  },
  {
    "Question": "Involving violence: Yes or No",
    "RelatedPasal_": ["89","170","285","336","351","352","353","365"],
    "RelatedPasal": ["89","351","352","353","356"]
  },
  {
    "Question": "Involving extortions: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Involving plane hijacking: Yes or No",
    "RelatedPasal": ["479i","479j", "479k"]
  },
  {
    "Question": "Involving boat hijacking: Yes or No",
    "RelatedPasal": ["438","439","444",]
  },

  {
    "Question": "Involving traffic accident: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Involving workplace accident: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Involving private properties destruction: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Involving public properties destruction: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Involving self-defense: Yes or No",
    "RelatedPasal": ["49"]
  },
  {
    "Question": "Any indication of premeditated crime: Yes or No",
    "RelatedPasal": ["340","350","353"]
  },
  {
    "Question": "Is this incident happened intentionally: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Is multiple people involved in the crime: Yes or No",
    "RelatedPasal": ["55"]
  },
  {
    "Question": "Is the offender dead: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Is the offender underage: Yes or No",
    "RelatedPasal": ["37","45","46", "91",]
  },
  {
    "Question": "Is the victim injured: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Is the victim permanently injured (crippled, lost limbs, blind, mute): Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Is the victim dead: Yes or No",
    "RelatedPasal": []
  },
  {
    "Question": "Is the victim underage: Yes or No",
    "RelatedPasal": ["37","91","287","292","293","294","295","301","305","330","331",]
  }
]
const _P_EXTRACT_CASE_QUESTIONER_ANSWERS_=
`_DATA_

===INSTRUCTION
${INSTRUCTION_1}
_QUESTION_LIST_
`

export class LawCaseClassifier
{
    constructor()
    {
        //this.prompt = _P_EXTRACT_CASE_QUESTIONER_ANSWERS_;
        this.questioner = [...QUESTIONER_DATA];
        this.answers = [];
    }

    GetQuestionerPrompt(data_context="")
    {
      let prompt = _P_EXTRACT_CASE_QUESTIONER_ANSWERS_.replace("_QUESTION_LIST_", this.GetQuestionList())
      prompt = prompt.replace("_DATA_",data_context)
      return prompt
    }

    GetQuestionList()
    {
        let rsp = "";
        for (const q of this.questioner) {
            rsp = `${rsp}${q.Question}\n`
        }
        return rsp
    }

    SetAnswers(questonerWithAnswers="")
    {
        this.answers = questonerWithAnswers.split(`\n`)
    }

    GetAnswersYes()
    {
        return this.answers.filter(x=>x.includes(': Yes')).join(`\n`)
    }

    GetAnswersNo()
    {
        return this.answers.filter(x=>x.includes(': No')).join(`\n`)
    }

    GetAnswersYesRelatedPasal()
    {
        let qal = this.GetAnswersYes().split(`\n`)
        //qal = qal.forEach(x=>x.trim())
        console.log(qal)
        let pasalList = [];
        for (const qa of qal) 
        {
            const qaClean = qa.split(":")[0];
            
            for (const tQA of this.questioner) 
            {
                if(tQA.Question.includes(qaClean))
                {
                    //console.log(tQA.Question)
                    //console.log(qaClean)
                    pasalList.push(...tQA.RelatedPasal)
                }
            }
        }

        pasalList = [...new Set(pasalList)];
        pasalList.sort(function(a, b) 
        {
        var pasalA = parseInt(a.replace(/\D/g, ''), 10);
        var pasalB = parseInt(b.replace(/\D/g, ''), 10);
      
        return pasalA - pasalB;
        });
  
        return pasalList
    }
    
    TestStuff()
    {
        const qas=
`Involving sexual assault: Yes
Involving theft or robbery: Yes
Is the offender under age: Yes
Is multiple people involved in the crime: Yes
Involving extortions: No
Involving traffic accident: No`
        
        console.log(this.GetQuestionerPrompt(`[This is DATA]\nSome law case stuff`))
        console.log("---------------")
        this.SetAnswers(qas.trim())
        console.log(this.GetQuestionList())
        console.log("---------------")
        console.log(this.GetAnswersNo())
        console.log("---------------")
        console.log(this.GetAnswersYes())
        console.log("---------------")
        console.log(this.GetAnswersYesRelatedPasal())
    }
}

//new LawCaseClassifier().TestStuff()
