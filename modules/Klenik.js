export function AstrologyGetSign(date) {
    const month = date.getMonth()+1;
    const day = date.getDate();
  
    if ((month === 1 && day <= 20) || (month === 12 && day >= 22)) {
      return "Capricorn";
    } else if ((month === 1 && day >= 21) || (month === 2 && day <= 18)) {
      return "Aquarius";
    } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
      return "Pisces";
    } else if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) {
      return "Aries";
    } else if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) {
      return "Taurus";
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
      return "Gemini";
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
      return "Cancer";
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
      return "Leo";
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
      return "Virgo";
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
      return "Libra";
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
      return "Scorpio";
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
      return "Sagittarius";
    }
}

export function NumerologyLifePathNumber(date) {
  // Ensure the input is a valid date string
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Invalid date format. Please use YYYY-MM-DD format.";
  }

  // Remove dashes and split the date into an array of digits
  const dateDigits = date.replace(/-/g, '').split('').map(Number);

  // Calculate the life path number by summing up the digits
  let lifePathNumber = dateDigits.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

  // Continue reducing until we get a single-digit number
  while (lifePathNumber > 9) {
    lifePathNumber = lifePathNumber.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }

  //Life Paths
  const LifePaths_short = 
  [{
      Nama:"Life Path 1", 
      Sifat:"Leadership, independence, ambition",
      Kelemahan:"Impulsiveness, Stubbornness, Arrogance"
    },
  {
    Nama: "Life Path 2",
    Sifat: "Cooperation, diplomacy, sensitivity",
    Kelemahan: "Indecisiveness, Over-sensitivity, Dependence"
  },
  {
    Nama: "Life Path 3",
    Sifat: "Creativity, communication, social skills",
    Kelemahan: "Scattered Energy, Superficiality, Overindulgence"
  },
  {
    Nama: "Life Path 4",
    Sifat: "Practicality, stability, organization",
    Kelemahan: "Rigidity,Pessimism,Stubbornness"
  },
  {
    Nama: "Life Path 5",
    Sifat: "Freedom, adventure, versatility",
    Kelemahan: "Restlessness, Impulsiveness, Overindulgence"
  },
  {
    Nama: "Life Path 6",
    Sifat: "Responsibility, nurturing, harmony",
    Kelemahan: "Overbearing, Martyrdom, Worry-prone"
  },
  {
    Nama: "Life Path 7",
    Sifat: "Analysis, introspection, spirituality",
    Kelemahan: "Isolation, Skepticism, Social Awkwardness"
  },
  {
    Nama: "Life Path 8",
    Sifat: "Success, power, material achievement",
    Kelemahan: "Materialism, Ruthlessness, Workaholism"
  },
  {
    Nama: "Life Path 9",
    Sifat: "Compassion, humanitarianism, selflessness",
    Kelemahan: "Idealism, Martyr Complex, Emotional Turmoil"
  }]


  const LifePaths = [
    {
      Nama: "Life Path 1",
      Sifat: "People with Life Path 1 exhibit strong leadership qualities, value independence, and possess a high level of ambition. They are determined and have a powerful willpower.",
      Kelemahan: "People with Life Path 1 may tend to act impulsively, often making decisions without careful consideration. They can display stubbornness and resistance to change, sticking to their chosen paths even when adjustments might be beneficial. Some individuals with this Life Path might come across as overly self-confident or domineering, at times appearing arrogant."
    },
    {
      Nama: "Life Path 2",
      Sifat: "Individuals with Life Path 2 are known for their cooperative nature, diplomatic skills, and heightened sensitivity. They excel in mediating and nurturing relationships.",
      Kelemahan: "Individuals on Life Path 2 may grapple with indecisiveness, finding it challenging to make choices confidently. They have a tendency to be oversensitive and can be easily hurt by criticism or rejection. Dependency on others for decision-making is a trait that some with this Life Path exhibit."
    },
    {
      Nama: "Life Path 3",
      Sifat: "Life Path 3 individuals are characterized by their creativity, strong communication abilities, and a knack for social interactions. They are often optimistic and enthusiastic.",
      Kelemahan: "People following Life Path 3 may struggle with scattered energy, making it difficult for them to concentrate on one specific task or goal. They might occasionally be perceived as shallow or insincere due to their occasional superficiality. Overindulgence in various aspects of life, such as excessive spending or partying, is a potential issue for some on this Life Path."
    },
    {
      Nama: "Life Path 4",
      Sifat: "Practicality, stability, and organizational skills define those with Life Path 4. They have a strong work ethic and are reliable individuals.",
      Kelemahan: "Individuals on Life Path 4 might exhibit rigidity, often being inflexible and resistant to change in their lives. Pessimism can be a challenge, as they tend to focus on negative aspects rather than positive ones. Some may resist adapting to new circumstances, displaying stubbornness in their approach."
    },
    {
      Nama: "Life Path 5",
      Sifat: "Individuals following Life Path 5 cherish freedom, thrive on adventure, and demonstrate great versatility. They are unafraid of change and possess excellent communication skills.",
      Kelemahan: "Those on Life Path 5 often grapple with restlessness, finding it difficult to commit to a single pursuit for an extended period. Impulsiveness is a common trait, and they may make hasty decisions without considering potential consequences. Overindulgence in various areas of life can pose challenges for some on this Life Path."
    },
    {
      Nama: "Life Path 6",
      Sifat: "Responsibility, nurturing, and a talent for creating harmony are hallmarks of Life Path 6 individuals. They excel in taking care of others and their communities.",
      Kelemahan: "Individuals following Life Path 6 may sometimes become overbearing, displaying an inclination towards being controlling or overly critical of others. They might adopt a martyrdom mindset, sacrificing their own needs excessively for the sake of others, sometimes to their detriment. Worrying excessively about loved ones is a tendency for some on this Life Path.",
    },
    {
      Nama: "Life Path 7",
      Sifat: "Those with Life Path 7 possess analytical minds, engage in introspection, and often explore spirituality. They have a thirst for knowledge and exhibit intellectual curiosity.",
      Kelemahan: "People with Life Path 7 may find themselves inclined towards isolation due to their introspective nature. They can be excessively critical and skeptical of others' beliefs and intentions. Social awkwardness or a feeling of disconnection from others may be experienced by some on this Life Path."
    },
    {
      Nama: "Life Path 8",
      Sifat: "Success, power, and material achievement are central to individuals following Life Path 8. They are ambitious, confident, and excel in the material world.",
      Kelemahan: "Individuals on Life Path 8 may become overly focused on materialism, often prioritizing wealth and success. Ruthlessness can emerge as they pursue power and may disregard ethical considerations in their pursuit. Some may prioritize work and financial gain to the detriment of personal relationships, potentially leading to workaholism."
    },
    {
      Nama: "Life Path 9",
      Sifat: "Life Path 9 individuals are characterized by their compassion, humanitarianism, and selflessness. They possess a strong sense of idealism and a desire to make a positive impact.",
      Kelemahan: "Those on Life Path 9 often hold idealistic views, sometimes expecting too much from themselves and others. A martyr complex can develop, where they sacrifice excessively for others, potentially leading to burnout. Emotional turmoil and inner conflict are common struggles for some on this Life Path."
    }
  ];
  

  return [lifePathNumber, LifePaths[lifePathNumber-1]];
}

export function AstrologyGetIndonesianMonthName(monthIndex=1) {
  // Array of Indonesian month names (0-based index)
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Check if the provided index is valid
  if (monthIndex >= 0 && monthIndex <= 11) {
    // Subtract 1 from the index to match the array's 0-based index
    const monthName = monthNames[monthIndex - 0];
    return monthName;
  } else {
    return 'Invalid month index';
  }
}

export function PrimbonGetHariPasaran(inputDate) {
    const days = ["Minggu-5", "Senin-4", "Selasa-3", "Rabu-7", "Kamis-8", "Jumat-6", "Saptu-9"];
    const pasaran = ['Legi-5','Pahing-9','Pon-7','Wage-4','Kliwon-8',];
    const d2 = new Date("1938/1/1");
    const d1 = inputDate;
    const selisih = Math.floor(Math.abs(d1-d2)/86400000);
    const dayPasaran = pasaran[selisih%5];
    const dayIndex = inputDate.getDay();
    const dayName = days[dayIndex];
    const dayNameNeptu = dayName.split("-");
    const dayPasaranNeptu = dayPasaran.split("-");
    const rsp = dayNameNeptu.concat(dayPasaranNeptu);
    const indoMonthName = AstrologyGetIndonesianMonthName(inputDate.getMonth())
    return [rsp[0], Number(rsp[1]),   rsp[2], Number(rsp[3]), indoMonthName]
}

export function PrimbonGetSifatElemenHariLahir(namaHariLahir="Senin"){
    const SifatHariLahir = 
    [
    {
        "Nama": "Bunga-Senin",
        "Karakter": "Pesona yang sangat luar biasa. Pusat perhatian banyak orang disekitar, karena kharismatik dan memiliki daya pikat yang luar biasa. Periang, ceria, humoris dan pandai menghibur orang lain. Sangat bertanggung jawab dan suka bersama keluarga.",
        "Kelemahan": "Sedikit sombong"
    },
    {
        "Nama": "Api-Selasa",
        "Karakter": "Semangat dan etos kerja yang tinggi, berjiwa pemimpin dan kharismatik. Sangat percaya diri, bertanggung jawab, memiliki jiwa sosial yang tinggi atau suka menolong. Orang yang setia.",
        "Kelemahan": "Jika marah meledak-ledak tidak terkendali"
    },
    {
        "Nama": "Daun-Rabu",
        "Karakter": "Sangat dermawan, tidak tegaan, memiliki empati yang tinggi dan mudah jatuh cinta. Kalem, pendiam dan susah didekati. Namun jika sudah dekat maka akan mudah bergaul. Sangat penyayang keluarga.",
        "Kelemahan": "Gampang percaya terhadap orang lain"
    },
    {
        "Nama": "Angin-Kamis",
        "Karakter": "Energik, tidak mau berdiam diri. Pekerja keras, tekun, giat, ulet, bertanggung jawab dan pantang menyerah. Tidak betah disuatu tempat, sehingga menjadikannya suka berpetualang.",
        "Kelemahan": "Prinsip yang kurang tegas atau kurang kuat"
    },
    {
        "Nama": "Air-Jumat",
        "Karakter": "Penyejuk bagi orang-orang disekitarnya. Cenderung tenang, namun agak dingin. Sangat bijaksana, suka mengalah.",
        "Kelemahan": "Sedikit egois, banyak menuntut dan selalu merasa benar"
    },
    {
        "Nama": "Tanah-Saptu",
        "Karakter": "Sabar, suka menolong, memiliki pengetahuan luas, bertanggung jawab, tidak gampang menyerah, tidak gampang putus asa dan optimis.",
        "Kelemahan": "Posesif, sedikit sombong dan keras kepala"
    },
    {
        "Nama": "Langit-Minggu",
        "Karakter": "Berwawasan luas, ceria, jarang sedih dan pandangannya selalu mengarah jauh kedepan. Pergaulan yang luas dan memiliki teman yang banyak. Totalitas yang sangat tinggi pada setiap kegiatan.",
        "Kelemahan": "Sedikit egois dan sedikit sombong, karena merasa diri paling pintar"
    }
    ]
  
    for (const item of SifatHariLahir) {
        if(item.Nama.includes(namaHariLahir))
        {
            return item;
        }
    }
    return null;
}

export function PrimbonGetPerJodohanHariLahir(neptuHariPasaran_a=[7,9], neptuHariPasaran_b=[5,5])
{
    const PrediksiPerjodohan=[
        {
            "Nama": "PEGAT",
            "Penjumlahan": [1, 9, 10, 18, 19, 27, 28, 36],
            "Prediksi": "Masalah akan sering ditemui oleh pasangan pegat di kemudian hari. Mulai dari masalah ekonomi, kekuasaan, dan perselingkuhan yang bisa menyebabkan perceraian (pegatan)."
        },
        {
            "Nama": "RATU",
            "Penjumlahan": [2, 11, 20, 29],
            "Prediksi": "Pasangan ini memang sudah jodoh. Bahkan, mereka akan dihargai dan disegani oleh tetangga dan lingkungan sekitar. Keharmonisannya pun membuat banyak orang iri."
        },
        {
            "Nama": "JODOH",
            "Penjumlahan": [3, 12, 21, 30],
            "Prediksi": "Pasangan ini memang sudah sangat cocok dan berjodoh. Mereka bisa saling menerima segala kelebihan dan kekurangan masing-masing. Rumah tangga pasangan jodoh bisa rukun sampai tua."
        },
        {
            "Nama": "TOPO",
            "Penjumlahan": [4, 13, 22, 31],
            "Prediksi": "Dalam membina rumah tangga, pasangan topo akan sering mengalami kesusahan di awal musim karena membutuhkan proses saling memahami dan beradaptasi. Namun, jangan khawatir keduanya akan bahagia pada akhirnya. Masalah yang dihadapi bisa saja soal ekonomi dan lainnya. Saat sudah memiliki anak dan cukup lama berumah tangga, mereka akhirnya akan hidup sukses dan bahagia."
        },
        {
            "Nama": "PADU",
            "Penjumlahan": [6, 15, 24, 33],
            "Prediksi": "Dalam berumah tangga, pasangan padu akan sering mengalami pertengkaran. Meskipun sering bertengkar, keduanya tidak sampai bercerai. Masalah pertengkaran tersebut bisa dipicu hal-hal sepele."
        },
        {
            "Nama": "SUJANAN",
            "Penjumlahan": [7, 16, 25, 34],
            "Prediksi": "Dalam berumah tangga, pasangan sujanan akan sering mengalami pertengkaran dan masalah perselingkuhan. Baik dari pihak laki-laki maupun perempuan yang memulai."
        }
    ]
    
    const valA = (neptuHariPasaran_a[0] + neptuHariPasaran_a[1])-9;
    const valB = (neptuHariPasaran_b[0] + neptuHariPasaran_b[1])-9;
    const AplusB = valA+valB;

    for (const item of PrediksiPerjodohan) {
      if(item.Penjumlahan.includes(AplusB))
      {
          return item;
      }
  }

    return null;
}


/* TESTs
const dateA = new Date("1978-04-17") //["Senin",4,"Pahing",9]
const dateB = new Date("1977-06-01") //["Rabu",7,"Pahing",9]
const dayDetailA = PrimbonGetHariPasaran(dateA)
const dayDetailB = PrimbonGetHariPasaran(dateB)
//console.log(dayDetailA)
//console.log(dayDetailB)
console.log( PrimbonGetPerJodohanHariLahir( [dayDetailA[1],dayDetailA[3]], [dayDetailB[1],dayDetailB[3]]    ) );
console.log( PrimbonGetSifatElemenHariLahir(dayDetailA[0]) )
console.log( PrimbonGetSifatElemenHariLahir(dayDetailB[0]) )
*/
  
  
  