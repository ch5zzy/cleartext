document.querySelector("#intensityValue").innerHTML = document.querySelector("#intensity").value;

document.querySelector("#intensity").oninput = function() {
	document.querySelector("#intensityValue").innerHTML = this.value;
}

async function lookupWord(word, lc = "", rc = "", tags = "fp") {
	var searchType = "ml";
	var url = "https://api.datamuse.com/words?" + searchType + "=" + word + "&qe=" + searchType + "&md=" + tags + "&lc" + lc + "&rc=" + rc;

	let response = await fetch(url);
	let result = await response.json();

	if(result[0] === undefined)
		return null;

	return result;
}

async function findBetterWord(word, lc, rc) {
	let wr = await lookupWord(word, lc, rc);
	if(wr == null)
		return word;

	var freq = parseFloat(wr[0].tags[wr[0].tags.length - 1].substring(2));
	var pos = wr[0].tags[1];

	if(freq > document.querySelector("#intensity").value)
		return word;
	if(!(word[0] === undefined) && word[0] === word[0].toUpperCase())
		if(word.length == 1)
			return word;
		else if(!(word[1] === word[1].toUpperCase()))
			return word;

	var r = word;
	wr.forEach(function(w) {
		w.word = w.word.toLowerCase();
		if(parseFloat(w.tags[w.tags.length - 1].substring(2)) > freq && w.score > 1500 && (w.tags[1] == pos && pos.substring(0, 1) != "f" && w.tags[1].substring != "f")) {
			r = w.word;
			freq = parseFloat(w.tags[w.tags.length - 1].substring(2));
		}
	});

	return r;
}

async function wordSimilarity(word1, word2) {
	let wr1 = await lookupWord(word1, "d");
	let wr2 = await lookupWord(word2, "d");
	if(wr1[0].defs === undefined || wr2[0].defs === undefined)
		return -1;

	var ignoreWords = "a,an,the,for,and,nor,but,or,yet,so";
	var def1 = wr1[0].defs[0].substring(2).split(" ");
	var def2 = wr2[0].defs[0].substring(2).split(" ");
	console.log(wr1[0].defs[0].substring(2));
	console.log(wr2[0].defs[0].substring(2));

	var sameWords = 0;
	for(i = def1.length - 1; i >= 0; i--) {
		def2.forEach(function(word2) {
			if(def1[i] == word2 && ignoreWords.indexOf(word2) == -1) {
				sameWords++;
				def1.splice(i, 1);
			}
		});
	}

	return sameWords;
}

//Array for common words to be skipped, speeds up process
var skipWords = ["for", "and", "nor", "but", "or", "yet", "so", "a", "an", "the", "of", "after", "before", "some", "about", "on", "in", "am", "is",
	"are", "was", "were", "has", "have", "with", "without", "to", "next", "away", "inside", "around", "outside", "I", "you", "he", "she", "we", "it",
	"her", "his", "their", "its", "our", "hers", "his", "theirs", "ours", "mine", "yours", "your"];

async function clearText(text) {
	var arr = text.split(" ");
	for(i = 0; i < arr.length; i++) {
		var w = arr[i];
		if(!skipWords.includes(w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""))) {
			var bw = await findBetterWord(w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""), arr[i - 1] || "", arr[i + 1] || "");

			arr[i] = arr[i].replace(w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""), bw);
			if(arr[i] != w)
				arr[i] = "<font color='yellow' title='" + w + "'><b>" + arr[i] + "</b></font>";
		}

		document.getElementById("loading").innerHTML = Math.round(i/arr.length * 100) + "%";
	}

	document.getElementById("loading").innerHTML = "Done analyzing text. Words with a frequency less than " + document.querySelector("#intensity").value + " words per million that had a common synonym were replaced.";

	return arr.join(" ");
}

async function checkSpelling(str) {
	let response = await fetch("https://montanaflynn-spellcheck.p.rapidapi.com/check/?text=" + str,
	{ headers: {"X-RapidAPI-Host": "montanaflynn-spellcheck.p.rapidapi.com", "X-RapidAPI-Key": "fc12b61274mshe7b398fe89b6b4ap194aa8jsndc7aab02b2fa"} });
	let data = await response.json();

	console.log(JSON.stringify(data));
	return data;
}

function PRINT(str) {
	document.querySelector("#console").innerHTML = "";
	document.getElementById("console").innerHTML += str + "<br>";
}