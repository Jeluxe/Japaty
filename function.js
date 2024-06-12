const codeBlockFormatter = (message) => {
  if (CODE_BLOCK_REGEX.test(message)) {
    return message.replaceAll(CODE_BLOCK_REGEX, (_, g1, g2) => {
      return `<pre class='language-${g1}'><div class='pre-header'>${g1}<span onclick='copyResponse(this)' class='material-symbols-rounded'>content_copy</span></div><code class='language-${g1} hljs'>${g1 === "regex" ? "<span class='hljs-regexp'>" + g2 + "</span>" : g2}</code></pre>`
    });
  }
  return message
}

const formatNewLine = (message) => {
  var placeholders = [];
  var idx = 0;

  // Remove all <pre>...</pre> sections
  message = message.replace(PRE_TAG_WITH_CLASS_CONTENT_REGEX, (match) => {
    placeholders[idx] = match;
    return '<pre-placeholder-' + (idx++) + '>';
  });

  // Do whatever you want in tempStr...
  message = message.replaceAll("\n", "<br/>");

  // Put the <pre>...</pre> sections back in
  placeholders.forEach((el, index) => {
    var placeholder = '<pre-placeholder-' + index + '>';
    message = message.replace(placeholder, el);
  });

  return message
}

const codeFormatter = (message) => {
  let saved = {};
  let idx = 0;
  let formated = message.replace(EXTRACT_CODE_BLOCK_REGEX, (match) => {
    saved[idx] = match;
    const temp = `<div class='placeholder-${idx}'/>`
    idx++;
    return temp;
  })
  formated = formated.replaceAll(CODE_REGEX, "<code>$1</code>");

  Object.values(saved).forEach((item, idx) =>
    formated = formated.replace(`<div class='placeholder-${idx}'/>`, item)
  )

  return formated
}

const displayColor = (message) => {
  if (DISPLAY_COLOR_REGEX.test(message)) {
    return message.replaceAll(DISPLAY_COLOR_REGEX, `<b style='background: $2;cursor: pointer;padding: 0 3px;color:${lightOrDark("$2") === "dark" ? "#000" : ""}' onclick='copyResponse(this)'>$2</b>`)
  }
  return message
}

function lightOrDark(color) {

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {

    // If HEX --> store the red, green, blue values in separate variables
    color = color.match(HEX_TO_RGB_REGEX);

    r = color[1];
    g = color[2];
    b = color[3];
  }
  else {

    // If RGB --> Convert it to HEX: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(
      color.length < 5 && /./g, '$&$&'
    )
    );

    r = color >> 16;
    g = color >> 8 & 255;
    b = color & 255;
  }

  // HSP equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {

    return 'light';
  }
  else {

    return 'dark';
  }
}

const propertyTagger = (message) => {
  if (embedExpressionsForPropertyRegex.test(message)) {
    return message.replaceAll(embedExpressionsForPropertyRegex, "<span class='hljs-property'>$1</span>");
  }
  return message;
}

const functionTagger = (message) => {
  if (EMBED_EXPRESSIONS_FOR_FUNCTION_REGEX.test(message)) {
    return message.replaceAll(EMBED_EXPRESSIONS_FOR_FUNCTION_REGEX, "<span class='hljs-title'>$1</span>")
  }
  return message
}

const categorizedDate = (date) => {
  const DAY = 24 * 60 * 60 * 1000;
  const WEEK = DAY * 7;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;
  const diffrence = Date.now() - date;
  if (new Date(date).getDate() === new Date().getDate() - 1) {
    return "Yesterday";
  } else if (diffrence < DAY) {
    return "Today"
  } else if (diffrence <= WEEK) {
    return "Past Week";
  } else if (diffrence <= MONTH) {
    return "Past Month";
  } else if (diffrence <= MONTH * 3) {
    return "Past 3 Months";
  } else if (diffrence <= YEAR) {
    return "Past Year";
  }
}

const sortByDates = (a, b) => {
  const { created_at: ACreated_at, edited_at: AEdited_at } = Object.values(a)[0]
  const { created_at: BCreated_at, edited_at: BEdited_at } = Object.values(b)[0]

  return (BEdited_at ?? new Date(BCreated_at).getTime()) - (AEdited_at ?? new Date(ACreated_at).getTime())
}

const generateID = () => {
  let id = "_" + Math.floor(Math.random() * 1000000001);
  const existsIds = Object.keys(chats);

  while (existsIds.includes("_" + id)) {
    id = "_" + Math.floor(Math.random() * 1000000001);
  }

  return id;
}