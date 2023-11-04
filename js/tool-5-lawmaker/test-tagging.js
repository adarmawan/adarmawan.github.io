//const RexSearchAlphaNumeric = new RegExp(/[^a-zA-Z0-9\s]/g)
const RexSearchAlphaNumeric = new RegExp(/[^a-zA-Z\s]/g)


/* NOTES
Sepertinya, klo di tagList tidak ada yg sesuai untuk PASAL,
LLM akan men-tag dengan asal-asalan.

*/
const tagList = ["kekerasan", "pemukulan", "penganiayaan", "pembunuhan", 
                "perusakan", "pembakaran", "penghancuran", 
                "pencurian", "perampokan", "penggelapan uang", "pengelapan barang", 
                "pemerasan", "pencemaran nama baik", "tuduhan palsu", 
                "kecurangan", "penipuan", "pemalsuan", 
                "pelecehan seksual", "pemerkosaan", "penculikan", "bersetubuh",
                "pembajakan pesawat", "pembajakan kapal laut", 
                "indonesia", "luar negeri", "laut", "udara", "tempat umum", "fasilitas umum", 
                "tanpa ijin", "ijin palsu", "surat palsu", "palsu",
                "surat", "uang", "merek", "tanda", "keterangan", 
                "dokter", "nahkoda", "pilot", "pejabat", "tentara", "pemberontak", "pemberontakan", 
                "presiden", "wakil presiden", "bendera", "lambang negara", 
                "ibu", "wanita", "anak", "bayi", "dibawah umur", "tidak berdaya", "aborsi"];

const stopWords = [
//"barang siapa","undang undang","barang barang",
//"pidana","penjara","rupiah","ribu","ratus","minggu","tahun","bulan",
"ada","adalah","adanya","adapun","agak","agaknya","agar","akan","akankah","akhir","akhiri","akhirnya","aku","akulah","amat","amatlah","anda","andalah","antar","antara","antaranya","apa","apaan","apabila","apakah","apalagi","apatah","artinya","asal","asalkan","atas","atau","ataukah","ataupun","awal","awalnya","bagai","bagaikan","bagaimana","bagaimanakah","bagaimanapun","bagi","bagian","bahkan","bahwa","bahwasanya","baik","bakal","bakalan","balik","banyak","bapak","baru","bawah","beberapa","begini","beginian","beginikah","beginilah","begitu","begitukah","begitulah","begitupun","bekerja","belakang","belakangan","belum","belumlah","benar","benarkah","benarlah","berada","berakhir","berakhirlah","berakhirnya","berapa","berapakah","berapalah","berapapun","berarti","berawal","berbagai","berdatangan","beri","berikan","berikut","berikutnya","berjumlah","berkali-kali","berkata","berkehendak","berkeinginan","berkenaan","berlainan","berlalu","berlangsung","berlebihan","bermacam","bermacam-macam","bermaksud","bermula","bersama","bersama-sama","bersiap","bersiap-siap","bertanya","bertanya-tanya","berturut","berturut-turut","bertutur","berujar","berupa","besar","betul","betulkah","biasa","biasanya","bila","bilakah","bisa","bisakah","boleh","bolehkah","bolehlah","buat","bukan","bukankah","bukanlah","bukannya","bulan","bung","cara","caranya","cukup","cukupkah","cukuplah","cuma","dahulu","dalam","dan","dapat","dari","daripada","datang","dekat","demi","demikian","demikianlah","dengan","depan","di","dia","diakhiri","diakhirinya","dialah","diantara","diantaranya","diberi","diberikan","diberikannya","dibuat","dibuatnya","didapat","didatangkan","digunakan","diibaratkan","diibaratkannya","diingat","diingatkan","diinginkan","dijawab","dijelaskan","dijelaskannya","dikarenakan","dikatakan","dikatakannya","dikerjakan","diketahui","diketahuinya","dikira","dilakukan","dilalui","dilihat","dimaksud","dimaksudkan","dimaksudkannya","dimaksudnya","diminta","dimintai","dimisalkan","dimulai","dimulailah","dimulainya","dimungkinkan","dini","dipastikan","diperbuat","diperbuatnya","dipergunakan","diperkirakan","diperlihatkan","diperlukan","diperlukannya","dipersoalkan","dipertanyakan","dipunyai","diri","dirinya","disampaikan","disebut","disebutkan","disebutkannya","disini","disinilah","ditambahkan","ditandaskan","ditanya","ditanyai","ditanyakan","ditegaskan","ditujukan","ditunjuk","ditunjuki","ditunjukkan","ditunjukkannya","ditunjuknya","dituturkan","dituturkannya","diucapkan","diucapkannya","diungkapkan","dong","dua","dulu","empat","enggak","enggaknya","entah","entahlah","guna","gunakan","hal","hampir","hanya","hanyalah","hari","harus","haruslah","harusnya","hendak","hendaklah","hendaknya","hingga","ia","ialah","ibarat","ibaratkan","ibaratnya","ibu","ikut","ingat","ingat-ingat","ingin","inginkah","inginkan","ini","inikah","inilah","itu","itukah","itulah","jadi","jadilah","jadinya","jangan","jangankan","janganlah","jauh","jawab","jawaban","jawabnya","jelas","jelaskan","jelaslah","jelasnya","jika","jikalau","juga","jumlah","jumlahnya","justru","kala","kalau","kalaulah","kalaupun","kalian","kami","kamilah","kamu","kamulah","kan","kapan","kapankah","kapanpun","karena","karenanya","kasus","kata","katakan","katakanlah","katanya","ke","keadaan","kebetulan","kecil","kedua","keduanya","keinginan","kelamaan","kelihatan","kelihatannya","kelima","keluar","kembali","kemudian","kemungkinan","kemungkinannya","kenapa","kepada","kepadanya","kesampaian","keseluruhan","keseluruhannya","keterlaluan","ketika","khususnya","kini","kinilah","kira","kira-kira","kiranya","kita","kitalah","kok","kurang","lagi","lagian","lah","lain","lainnya","lalu","lama","lamanya","lanjut","lanjutnya","lebih","lewat","lima","luar","macam","maka","makanya","makin","malah","malahan","mampu","mampukah","mana","manakala","manalagi","masa","masalah","masalahnya","masih","masihkah","masing","masing-masing","mau","maupun","melainkan","melakukan","melalui","melihat","melihatnya","memang","memastikan","memberi","memberikan","membuat","memerlukan","memihak","meminta","memintakan","memisalkan","memperbuat","mempergunakan","memperkirakan","memperlihatkan","mempersiapkan","mempersoalkan","mempertanyakan","mempunyai","memulai","memungkinkan","menaiki","menambahkan","menandaskan","menanti","menanti-nanti","menantikan","menanya","menanyai","menanyakan","mendapat","mendapatkan","mendatang","mendatangi","mendatangkan","menegaskan","mengakhiri","mengapa","mengatakan","mengatakannya","mengenai","mengerjakan","mengetahui","menggunakan","menghendaki","mengibaratkan","mengibaratkannya","mengingat","mengingatkan","menginginkan","mengira","mengucapkan","mengucapkannya","mengungkapkan","menjadi","menjawab","menjelaskan","menuju","menunjuk","menunjuki","menunjukkan","menunjuknya","menurut","menuturkan","menyampaikan","menyangkut","menyatakan","menyebutkan","menyeluruh","menyiapkan","merasa","mereka","merekalah","merupakan","meski","meskipun","meyakini","meyakinkan","minta","mirip","misal","misalkan","misalnya","mula","mulai","mulailah","mulanya","mungkin","mungkinkah","nah","naik","namun","nanti","nantinya","nyaris","nyatanya","oleh","olehnya","pada","padahal","padanya","pak","paling","panjang","pantas","para","pasti","pastilah","penting","pentingnya","per","percuma","perlu","perlukah","perlunya","pernah","persoalan","pertama","pertama-tama","pertanyaan","pertanyakan","pihak","pihaknya","pukul","pula","pun","punya","rasa","rasanya","rata","rupanya","saat","saatnya","saja","sajalah","saling","sama","sama-sama","sambil","sampai","sampai-sampai","sampaikan","sana","sangat","sangatlah","satu","saya","sayalah","se","sebab","sebabnya","sebagai","sebagaimana","sebagainya","sebagian","sebaik","sebaik-baiknya","sebaiknya","sebaliknya","sebanyak","sebegini","sebegitu","sebelum","sebelumnya","sebenarnya","seberapa","sebesar","sebetulnya","sebisanya","sebuah","sebut","sebutlah","sebutnya","secara","secukupnya","sedang","sedangkan","sedemikian","sedikit","sedikitnya","seenaknya","segala","segalanya","segera","seharusnya","sehingga","seingat","sejak","sejauh","sejenak","sejumlah","sekadar","sekadarnya","sekali","sekali-kali","sekalian","sekaligus","sekalipun","sekarang","sekecil","seketika","sekiranya","sekitar","sekitarnya","sekurang-kurangnya","sekurangnya","sela","selagi","selain","selaku","selalu","selama","selama-lamanya","selamanya","selanjutnya","seluruh","seluruhnya","semacam","semakin","semampu","semampunya","semasa","semasih","semata","semata-mata","semaunya","sementara","semisal","semisalnya","sempat","semua","semuanya","semula","sendiri","sendirian","sendirinya","seolah","seolah-olah","seorang","sepanjang","sepantasnya","sepantasnyalah","seperlunya","seperti","sepertinya","sepihak","sering","seringnya","serta","serupa","sesaat","sesama","sesampai","sesegera","sesekali","seseorang","sesuatu","sesuatunya","sesudah","sesudahnya","setelah","setempat","setengah","seterusnya","setiap","setiba","setibanya","setidak-tidaknya","setidaknya","setinggi","seusai","sewaktu","siap","siapa","siapakah","siapapun","sini","sinilah","soal","soalnya","suatu","sudah","sudahkah","sudahlah","supaya","tadi","tadinya","tahu","tahun","tak","tambah","tambahnya","tampak","tampaknya","tandas","tandasnya","tanpa","tanya","tanyakan","tanyanya","tapi","tegas","tegasnya","telah","tempat","tengah","tentang","tentu","tentulah","tentunya","tepat","terakhir","terasa","terbanyak","terdahulu","terdapat","terdiri","terhadap","terhadapnya","teringat","teringat-ingat","terjadi","terjadilah","terjadinya","terkira","terlalu","terlebih","terlihat","termasuk","ternyata","tersampaikan","tersebut","tersebutlah","tertentu","tertuju","terus","terutama","tetap","tetapi","tiap","tiba","tiba-tiba","tidak","tidakkah","tidaklah","tiga","tinggi","toh","tunjuk","turut","tutur","tuturnya","ucap","ucapnya","ujar","ujarnya","umum","umumnya","ungkap","ungkapnya","untuk","usah","usai","waduh","wah","wahai","waktu","waktunya","walau","walaupun","wong","yaitu","yakin","yakni","yang"];

const inputText1 = `Barang siapa menjadikan sebagai mata pencarian atau kebiasaan untuk membeli barang-barang, dengan maksud supaya tanpa pembayaran seluruhnya memastikan penguasaan terhadap barang- barang itu untuk diri sendiri maupun orang lain diancam dengan pidana penjara paling lama empat tahun`;
const inputText2 = `Seorang nahkoda kapal Indonesia yang tanpa alasan yang dapat diterima menolak untuk memenuhi permintaan berdasarkan undang-undang untuk menerima di kapalnya seorang terdakwa atau terpidana beserta benda-benda yang berhubungan dengan perkaranya, diancam dengan pidana penjara paling lama empat bulan dua minggu atau pidana denda paling banyak empat ribu lima ratus rupiah.`
const inputText3 = `(1) Diancam karena melakukan pembajakan di tepi laut dengan pidana penjara paling lama lima belas tahun, barang siapa dengan memakai kapal melakukan perbuatan kekerasan terhadap kapal lain atau terhadap orang atau barang di atasnya, di perairan Indonesia. (2) Yang dimaksud dengan wilayah laut Indonesia yaitu wilayah "Territoriale zee en maritieme kringen ordonantie, S. 1939 442.`
const inputText4 = `(1) Barang siapa bersetubuh dengan seorang wanita di luar perkawinan, padahal diketahuinya atau sepatutnya harus diduganya bahwa umumya belum lima belas tahun, atau kalau umurnya tidak jelas, bawa belum waktunya untuk dikawin, diancam dengan pidana penjara paling lama sembilan tahun. (2) Penuntutan hanya dilakukan atas pengaduan, kecuali jika umur wanita belum sampai dua belas tahun atau jika ada salah satu hal berdasarkan pasal 291 dan pasal 294.`

function filterTextByTagList(inputText, tagList) {
    // Convert inputText to lowercase for case-insensitive comparison
    const lowercasedInput = inputText.toLowerCase();

    // Split inputText into words
    const words = lowercasedInput.match(/\b\w+\b/g);

    // Use a Set to store unique words
    const uniqueWordsSet = new Set();

    // Filter out words that are in tagList and add them to the Set
    words.forEach(word => {
        if (tagList.includes(word)) {
            uniqueWordsSet.add(word);
        }
    });

    // Convert the Set back to an array
    const uniqueWordsArray = Array.from(uniqueWordsSet);

    // Join the unique words back into a string
    const resultText = uniqueWordsArray.join(' ');

    return resultText;
}
function removeStopWords(inputText, stopWords) {

    stopWords.forEach(item => {
        const regex = new RegExp("\\b" + item + "\\b", "gi");
        inputText = inputText.replaceAll(regex," ")
    });

    return inputText
    /*
    // Split the input text into an array of words
    const words = inputText.split(" ");
  
    // Filter out stop words
    const filteredWords = words.filter(word => !stopWords.includes(word));
  
    // Join the filtered words back into a sentence
    const resultText = filteredWords.join(" ");

    return resultText;
    */


    
}
function getUniqueWordsFromArray(stringArray)
{
    const combinedTags = stringArray.join(' ');
    const wordsArray = combinedTags.split(/\s+/);

    return [...new Set(wordsArray)];
}
function cleanToAlphaNumericOnly(text="")
{
  return text.replace(RexSearchAlphaNumeric, " "); //convert "what? is life:" to "what is life"
}
function cleanWhiteSpaces(text="") 
{
    var tArr = text.split(" ");
    return tArr.filter(item => /\S/.test(item)).join(" ");
}


let cleanSentence = inputText4.toLowerCase()
cleanSentence = cleanToAlphaNumericOnly(cleanSentence)
cleanSentence = removeStopWords(cleanSentence, stopWords)
cleanSentence = cleanWhiteSpaces(cleanSentence)
//cleanSentence = getUniqueWordsFromArray(cleanSentence.split(" ")).join(" ")

const uniqueTagList = getUniqueWordsFromArray(tagList)
const sentenceTags = filterTextByTagList(cleanSentence, uniqueTagList)

//console.log(tagList);
//console.log(uniqueTagList);
console.log(sentenceTags);
console.log(cleanSentence)
