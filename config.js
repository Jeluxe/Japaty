const CONFIG = {
  API_KEY: "use your API_KEY here",
  TEXT_API: "https://api.openai.com/v1/chat/completions",
  IMAGE_API: "https://api.openai.com/v1/images/generations",
  MODELS: [
    { id: 1, model: "gpt-4" },
    { id: 2, model: "gpt-4-turbo-2024-04-09" },
    { id: 3, model: "gpt-4-vision-preview" },
    { id: 4, model: "gpt-4o" }
  ],
  ANGLE_BRACKET_REGEX: /[<>]/g,
  CODE_BLOCK_REGEX: /\`\`\`(\w+)\s([\s\S]*?)\`\`\`/g,
  REMOVE_NEW_LINE_AFTER_PRE_TAG_REGEX: /(<\/pre>)(<br\/>)/g,
  BOLD_REGEX: /\*\*(.*?)\*\*/g,
  HEADING_REGEX: /(#+)\s(\<?\w+.*?)(<br\/>)/g,
  LINK_REGEX: /\[(.*?)\]\(((http)?(?:s)?(\:\/\/).*?)\)/g,
  UNDERLINING_REGEX: /\n_([^\s]+)/g,
  CODE_REGEX: /(?:\`{1,3})(<br\/>)?(.*?)(?:(<br\/>)?\`{1,3})/g,
  EXTRACT_IMAGE_REGEX: /^(img:\s)(.*)/g,
  EXTRACT_IMAGE_WITH_RESOLUTION_REGEX: /^(img)(\(\d{2,4}x\d{2,4}\))\:\s|^(img)\:\s/g,
  EXTRACT_CODE_BLOCK_REGEX: /(<code class='.*'>)([\s\S]*?)<\/code>/g,
  DISPLAY_COLOR_REGEX: /(?<=([\w\s].*?))(?:\()(\#[\w\d]{3,8})(?:\))/g,
  ANY_WHITESPACE_NEW_LINE_REGEX: /\n*?/g,
  PRE_TAG_WITH_CLASS_CONTENT_REGEX: /<pre class=\'.*\'>[\s\S]*?<\/pre>/g,
  EMBED_EXPRESSIONS_FOR_PROPERTY_REGEX: /(?<=\$\{.*)(?<=\.)(?!\w+[\(\-])(\w+)(?=\s|)/g,
  EMBED_EXPRESSIONS_FOR_FUNCTION_REGEX: /(?<=\$\{[\w\s].*?\.)([\w\s]*)(?=\(.*\})/g,
  HEX_TO_RGB_REGEX: /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/g,
};

const {
  API_KEY,
  TEXT_API,
  IMAGE_API,
  MODELS,
  ANGLE_BRACKET_REGEX,
  CODE_BLOCK_REGEX,
  LINK_REGEX,
  REMOVE_NEW_LINE_AFTER_PRE_TAG_REGEX,
  BOLD_REGEX,
  HEADING_REGEX,
  UNDERLINING_REGEX,
  CODE_REGEX,
  EXTRACT_IMAGE_REGEX,
  EXTRACT_IMAGE_WITH_RESOLUTION_REGEX,
  ANY_WHITESPACE_NEW_LINE_REGEX,
  EXTRACT_CODE_BLOCK_REGEX,
  DISPLAY_COLOR_REGEX,
  PRE_TAG_WITH_CLASS_CONTENT_REGEX,
  EMBED_EXPRESSIONS_FOR_PROPERTY_REGEX,
  EMBED_EXPRESSIONS_FOR_FUNCTION_REGEX,
  HEX_TO_RGB_REGEX
} = CONFIG;