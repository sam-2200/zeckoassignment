const { GoogleSpreadsheet } = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./client_secret.json');
const doc = new GoogleSpreadsheet('1VNiT0rUcT0LFrtqdGklY0jwjtaFWYRoBCwlwCb5Qxkc');

// searching algorithm
function computeLPSArray(pat, M, lps) {
    // length of the previous longest prefix suffix
    var len = 0;
    var i = 1;
    lps[0] = 0; // lps[0] is always 0

    // the loop calculates lps[i] for i = 1 to M-1
    while (i < M) {
        if (pat.charAt(i) == pat.charAt(len)) {
            len++;
            lps[i] = len;
            i++;
        }
        else // (pat[i] != pat[len])
        {
            if (len != 0) {
                len = lps[len - 1];

                // Also, note that we do not increment
                // i here
            }
            else // if (len == 0)
            {
                lps[i] = len;
                i++;
            }
        }
    }
}

function KMPSearch(pat, txt) {
    // console.log(pat);
    var M = pat.length;
    var N = txt.length;
    // console.log(JSON.stringify(txt));
    // create lps[] that will hold the longest
    // prefix suffix values for pattern
    var lps = [];
    var j = 0; // index for pat[]

    // Preprocess the pattern (calculate lps[]
    // array)
    computeLPSArray(pat, M, lps);

    var i = 0; // index for txt[]
    while ((N - i) >= (M - j)) {
        if (pat.charAt(j) == txt.charAt(i)) {
            j++;
            i++;
        }
        if (j == M) {
            // console.log("found");
            return true;
        }
        else if (i < N && pat.charAt(j) != txt.charAt(i)) {
            // Do not match lps[0..lps[j-1]] characters,
            // they will match anyway
            if (j != 0)
                j = lps[j - 1];
            else
                i = i + 1;
        }

    }
    // console.log("not found");
    return false;
}




function stringMatching(responses) {
    if (KMPSearch("shopify", responses)) {
        return "SHOPIFY";
    }
    else if (KMPSearch("woocommerce", responses)) {
        return "WOOCOMMERCE";
    }
    else if (KMPSearch("bigcommerce", responses)) {
        return "BIGCOMMERCE";
    }
    else if (KMPSearch("magento", responses)) {
        return "MAGENTO";
    }
    else
        return "OTHERS";
    return "UnExpected";

}
async function findCategory(url) {
    var result = "";
    await fetch(url, {
        method: 'get'
    }).then(async (response) => {
        return response.text();
    }).then(function (data) {
        var txt = JSON.stringify(data);;
        const res = stringMatching(txt);
        result = res;
    }).catch(err => {
        result = "NOT_WORKING"
    });
    return result;
}
//  async function findCategory(url){
//     var result="";
//     await fetch( url, { 
// 	method: 'get' 
//     }).then( function( response ) { 
//         var txt;
//         response.headers.forEach(header => {
//             txt += JSON.stringify(header);
//         });   

//         const res = stringMatching(txt);
//         console.log(res+" "+ url);
//         console.log(res);
//         result= res;
//  }).catch(err => { result= "NOT_WORKING" });
//  return result;
// }
async function accessSpreadsheet() {
    await doc.useServiceAccountAuth({
        client_email: creds.client_email,
        private_key: creds.private_key,
    });

    await doc.loadInfo(); // loads document properties and worksheets
    console.log(doc.title);

    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]

    await sheet.loadCells(); // loads range of cells into local cache - DOES NOT RETURN THE CELLS
    //   console.log(sheet.cellStats); // total cells, loaded, how many non-empty

    let url = sheet.getCell(1, 0);
    let i = 1;
    const categoryCol = sheet.getCell(0, 1);
    categoryCol.value = 'Category';
    categoryCol.textFormat = { bold: true };
    while (url.value != null) {
        let categoryCell = sheet.getCell(i, 1);
        var res = await findCategory(url.value);
        categoryCell.value = res;
        console.log(url.value + " " + res + " :" + i);
        url = sheet.getCell(++i, 0);
        await sheet.saveUpdatedCells();
    }

    await sheet.saveUpdatedCells();


}
accessSpreadsheet();