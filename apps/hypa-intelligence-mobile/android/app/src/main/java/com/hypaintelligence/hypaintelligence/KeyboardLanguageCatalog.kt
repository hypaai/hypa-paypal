package com.hypaintelligence.hypaintelligence

object KeyboardLanguageCatalog {
  data class ServiceModelSelection(val provider: String, val model: String)

  val defaultProviderName = "hypaai"
  val defaultTranslationModelName = "auto"
  val defaultDictionaryModelName = "Hypa-Llama3.1-8b-SFT"
  val defaultTtsModelName = "auto"
  val defaultSttModelName = "auto"
  val defaultSourceLanguage = TranslationLanguage("en", "English")
  val defaultTargetLanguage = TranslationLanguage("yo", "Yoruba")
  val defaultDictionaryLanguage = TranslationLanguage("en", "English")
  val autoDetect = TranslationLanguage("auto", "Auto-Detect")
  val defaultVoice = ""

  val allLanguages: List<TranslationLanguage> by lazy { listOf(
    TranslationLanguage("af", "Afrikaans"),
    TranslationLanguage("sq", "Albanian"),
    TranslationLanguage("am", "Amharic"),
    TranslationLanguage("an", "Annang"),
    TranslationLanguage("ar", "Arabic"),
    TranslationLanguage("ar-dz", "Arabic (Algerian)"),
    TranslationLanguage("ar-eg", "Arabic (Egyptian)"),
    TranslationLanguage("ar-ly", "Arabic (Libyan)"),
    TranslationLanguage("ar-ma", "Arabic (Moroccan)"),
    TranslationLanguage("ar-sd", "Arabic (Sudanese)"),
    TranslationLanguage("ar-tn", "Arabic (Tunisian)"),
    TranslationLanguage("hy", "Armenian"),
    TranslationLanguage("as", "Assamese"),
    TranslationLanguage("aii", "Assyrian Neo-Aramaic"),
    TranslationLanguage("az", "Azerbaijani"),
    TranslationLanguage("bm", "Bambara"),
    TranslationLanguage("eu", "Basque"),
    TranslationLanguage("be", "Belarusian"),
    TranslationLanguage("bem", "Bemba"),
    TranslationLanguage("bn", "Bengali"),
    TranslationLanguage("ber", "Berber"),
    TranslationLanguage("bs", "Bosnian"),
    TranslationLanguage("bg", "Bulgarian"),
    TranslationLanguage("ca", "Catalan"),
    TranslationLanguage("ceb", "Cebuano"),
    TranslationLanguage("ny", "Chichewa"),
    TranslationLanguage("zh", "Chinese"),
    TranslationLanguage("co", "Corsican"),
    TranslationLanguage("hr", "Croatian"),
    TranslationLanguage("cs", "Czech"),
    TranslationLanguage("da", "Danish"),
    TranslationLanguage("dv", "Dhivehi"),
    TranslationLanguage("nl", "Dutch"),
    TranslationLanguage("ebz", "Ebira"),
    TranslationLanguage("ef", "Efik"),
    TranslationLanguage("ego", "Eggon"),
    TranslationLanguage("en", "English"),
    TranslationLanguage("eo", "Esperanto"),
    TranslationLanguage("et", "Estonian"),
    TranslationLanguage("ee", "Ewe"),
    TranslationLanguage("fil", "Filipino (Tagalog)"),
    TranslationLanguage("fi", "Finnish"),
    TranslationLanguage("fon", "Fongbe"),
    TranslationLanguage("fr", "French"),
    TranslationLanguage("fy", "Frisian"),
    TranslationLanguage("ff", "Fula"),
    TranslationLanguage("gl", "Galician"),
    TranslationLanguage("gaq", "Gata'"),
    TranslationLanguage("ka", "Georgian"),
    TranslationLanguage("de", "German"),
    TranslationLanguage("el", "Greek"),
    TranslationLanguage("gu", "Gujarati"),
    TranslationLanguage("ht", "Haitian Creole"),
    TranslationLanguage("ha", "Hausa"),
    TranslationLanguage("haw", "Hawaiian"),
    TranslationLanguage("he", "Hebrew"),
    TranslationLanguage("hi-in", "Hindi"),
    TranslationLanguage("hmn", "Hmong"),
    TranslationLanguage("hu", "Hungarian"),
    TranslationLanguage("ib", "Ibibio"),
    TranslationLanguage("is", "Icelandic"),
    TranslationLanguage("id", "Idoma"),
    TranslationLanguage("igl", "Igala"),
    TranslationLanguage("ig", "Igbo"),
    TranslationLanguage("ige", "Igede"),
    TranslationLanguage("id-id", "Indonesian"),
    TranslationLanguage("ga", "Irish"),
    TranslationLanguage("it-it", "Italian"),
    TranslationLanguage("ja-jp", "Japanese"),
    TranslationLanguage("jv", "Javanese"),
    TranslationLanguage("kgk", "Kaiwá"),
    TranslationLanguage("kn", "Kannada"),
    TranslationLanguage("kr", "Kanuri"),
    TranslationLanguage("kk", "Kazakh"),
    TranslationLanguage("km", "Khmer"),
    TranslationLanguage("kg", "Kikongo"),
    TranslationLanguage("ki", "Kikuyu"),
    TranslationLanguage("rw", "Kinyarwanda"),
    TranslationLanguage("rn", "Kirundi"),
    TranslationLanguage("ko-kr", "Korean"),
    TranslationLanguage("kri", "Krio"),
    TranslationLanguage("ku", "Kurdish"),
    TranslationLanguage("ky", "Kyrgyz"),
    TranslationLanguage("lo", "Lao"),
    TranslationLanguage("la", "Latin"),
    TranslationLanguage("lv", "Latvian"),
    TranslationLanguage("lif", "Limbu"),
    TranslationLanguage("ln", "Lingala"),
    TranslationLanguage("lt", "Lithuanian"),
    TranslationLanguage("lg", "Luganda"),
    TranslationLanguage("lb", "Luxembourgish"),
    TranslationLanguage("mk", "Macedonian"),
    TranslationLanguage("mg", "Malagasy"),
    TranslationLanguage("mg-plateau", "Malagasy (Plateau)"),
    TranslationLanguage("ms", "Malay"),
    TranslationLanguage("ml", "Malayalam"),
    TranslationLanguage("mt", "Maltese"),
    TranslationLanguage("mi", "Maori"),
    TranslationLanguage("mr", "Marathi"),
    TranslationLanguage("mpj", "Martu Wangka"),
    TranslationLanguage("mni-mtei", "Meiteilon (Manipuri)"),
    TranslationLanguage("mn", "Mongolian"),
    TranslationLanguage("my", "Myanmar (Burmese)"),
    TranslationLanguage("nr", "Ndebele (South)"),
    TranslationLanguage("ne", "Nepali"),
    TranslationLanguage("no", "Norwegian"),
    TranslationLanguage("nup", "Nupe"),
    TranslationLanguage("or", "Odia (Oriya)"),
    TranslationLanguage("om", "Oromo"),
    TranslationLanguage("ps", "Pashto"),
    TranslationLanguage("fa", "Persian"),
    TranslationLanguage("pcm", "Pidgin"),
    TranslationLanguage("pl", "Polish"),
    TranslationLanguage("pt", "Portuguese"),
    TranslationLanguage("pa", "Punjabi"),
    TranslationLanguage("ro", "Romanian"),
    TranslationLanguage("ru", "Russian"),
    TranslationLanguage("sm", "Samoan"),
    TranslationLanguage("gd", "Scots Gaelic"),
    TranslationLanguage("nso", "Sepedi"),
    TranslationLanguage("sr", "Serbian"),
    TranslationLanguage("st", "Sesotho"),
    TranslationLanguage("sn", "Shona"),
    TranslationLanguage("sd", "Sindhi"),
    TranslationLanguage("si", "Sinhala (Sinhalese)"),
    TranslationLanguage("sk", "Slovak"),
    TranslationLanguage("sl", "Slovenian"),
    TranslationLanguage("so", "Somali"),
    TranslationLanguage("es", "Spanish"),
    TranslationLanguage("su", "Sundanese"),
    TranslationLanguage("sw", "Swahili"),
    TranslationLanguage("ss", "Swati"),
    TranslationLanguage("sv", "Swedish"),
    TranslationLanguage("tg", "Tajik"),
    TranslationLanguage("ta", "Tamil"),
    TranslationLanguage("te", "Telugu"),
    TranslationLanguage("th", "Thai"),
    TranslationLanguage("ti", "Tigrinya"),
    TranslationLanguage("tv", "Tiv"),
    TranslationLanguage("ts", "Tsonga"),
    TranslationLanguage("tn", "Tswana"),
    TranslationLanguage("tr", "Turkish"),
    TranslationLanguage("tw", "Twi"),
    TranslationLanguage("tzo", "Tzotzil"),
    TranslationLanguage("uk", "Ukrainian"),
    TranslationLanguage("umb", "Umbundu"),
    TranslationLanguage("ur", "Urdu"),
    TranslationLanguage("urh", "Urhobo"),
    TranslationLanguage("usa", "Usarufa"),
    TranslationLanguage("ug", "Uyghur"),
    TranslationLanguage("uz", "Uzbek"),
    TranslationLanguage("ve", "Venda"),
    TranslationLanguage("vi", "Vietnamese"),
    TranslationLanguage("wbi", "Vwanji"),
    TranslationLanguage("cy", "Welsh"),
    TranslationLanguage("wo", "Wolof"),
    TranslationLanguage("xh", "Xhosa"),
    TranslationLanguage("yi", "Yiddish"),
    TranslationLanguage("yo", "Yoruba"),
    TranslationLanguage("zu", "Zulu"),
  ) }

  private val translationLanguageCodesByModel: Map<String, List<String>> by lazy { mapOf(
    "gpt-5.6-sol" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5.6-terra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5.6-luna" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-6-astra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-4o-mini" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5-nano" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "auto" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh", "hu", "ro", "th", "tr", "uk", "vi", "af", "am", "as", "az", "be", "bg", "bs", "ca", "ceb", "co", "cy", "dv", "eo", "et", "eu", "fa", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hmn", "hr", "hy", "is", "jv", "ka", "kk", "km", "kn", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "no", "ny", "or", "pa", "ps", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "te", "tg", "ug", "ur", "uz", "xh", "yi", "zu", "bm", "bem", "ee", "kg", "rw", "rn", "ln", "lg", "nr", "om", "nso", "ss", "ti", "ts", "tn"),
    "Hypa-Llama3.1-8b-SFT" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "Hypa-Llama3.1-8b-SFT-RP" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypa-llama3-2-8b-sft-2025-12-rvl" to listOf("en", "yo", "ig", "ha", "tv", "an", "ef", "ib", "id", "ebz", "igl", "ar", "ego", "fon", "fr", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tw", "urh"),
    "google/gemma-4-31B-it:novita" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "google/gemma-4-26B-A4B-it:novita" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "gemini-3.5-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.5-flash-lite" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.8-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "mansa-translate" to listOf("af", "am", "ar", "bm", "bem", "ny", "en", "ee", "ha", "ig", "kg", "rw", "rn", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "sw", "ss", "ti", "ts", "tn", "tw", "xh", "yo", "zu"),
    "muse-spark-1.3" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "muse-spark-1.2" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "muse-wonder-1.0" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-models/Muse-Spark-Open-816B-A42B:baseten" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-models/Muse-Glimmer-30B:deepinfra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-4-Scout-17B-16E-Instruct:nscale" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-3.3-70B-Instruct:scaleway" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-3.1-8B-Instruct:deepinfra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "NousResearch/Hermes-3-Llama-3.1-70B:featherless-ai" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
  ) }

  private val dictionaryLanguageCodesByModel: Map<String, List<String>> by lazy { mapOf(
    "gpt-5.6-sol" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5.6-terra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5.6-luna" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-6-astra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "Hypa-Llama3.1-8b-SFT" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "Hypa-Llama3.1-8b-SFT-RP" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypa-llama3-2-8b-sft-2025-12-rvl" to listOf("en", "yo", "ig", "ha", "tv", "an", "ef", "ib", "id", "ebz", "igl", "ar", "ego", "fon", "fr", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tw", "urh"),
    "google/gemma-4-31B-it:novita" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "google/gemma-4-26B-A4B-it:novita" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "gemini-3.5-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.5-flash-lite" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.8-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "muse-spark-1.3" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "muse-spark-1.2" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "muse-wonder-1.0" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-models/Muse-Spark-Open-816B-A42B:baseten" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-models/Muse-Glimmer-30B:deepinfra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-4-Scout-17B-16E-Instruct:nscale" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-3.3-70B-Instruct:scaleway" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-3.1-8B-Instruct:deepinfra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "NousResearch/Hermes-3-Llama-3.1-70B:featherless-ai" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
  ) }

  private val languageCodesByModel: Map<String, List<String>> by lazy { mapOf(
    "gpt-5.6-sol" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5.6-terra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5.6-luna" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-6-astra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "Hypa-Llama3.1-8b-SFT" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "Hypa-Llama3.1-8b-SFT-RP" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypa-llama3-2-8b-sft-2025-12-rvl" to listOf("en", "yo", "ig", "ha", "tv", "an", "ef", "ib", "id", "ebz", "igl", "ar", "ego", "fon", "fr", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tw", "urh"),
    "google/gemma-4-31B-it:novita" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "google/gemma-4-26B-A4B-it:novita" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "gemini-3.5-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.5-flash-lite" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.8-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "muse-spark-1.3" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "muse-spark-1.2" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "muse-wonder-1.0" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-models/Muse-Spark-Open-816B-A42B:baseten" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-models/Muse-Glimmer-30B:deepinfra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-4-Scout-17B-16E-Instruct:nscale" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-3.3-70B-Instruct:scaleway" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "meta-llama/Llama-3.1-8B-Instruct:deepinfra" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "NousResearch/Hermes-3-Llama-3.1-70B:featherless-ai" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "cs", "de", "el", "hi-in", "hu", "id-id", "it-it", "ja-jp", "ko-kr", "nl", "pl", "ro", "ru", "th", "tr", "uk", "vi", "zh"),
    "gpt-4o-mini" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "gpt-5-nano" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh"),
    "auto" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh", "hu", "ro", "th", "tr", "uk", "vi", "af", "am", "as", "az", "be", "bg", "bs", "ca", "ceb", "co", "cy", "dv", "eo", "et", "eu", "fa", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hmn", "hr", "hy", "is", "jv", "ka", "kk", "km", "kn", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "no", "ny", "or", "pa", "ps", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "te", "tg", "ug", "ur", "uz", "xh", "yi", "zu", "bm", "bem", "ee", "kg", "rw", "rn", "ln", "lg", "nr", "om", "nso", "ss", "ti", "ts", "tn"),
    "mansa-translate" to listOf("af", "am", "ar", "bm", "bem", "ny", "en", "ee", "ha", "ig", "kg", "rw", "rn", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "sw", "ss", "ti", "ts", "tn", "tw", "xh", "yo", "zu"),
  ) }

  private val sttLanguageCodesByModel: Map<String, List<String>> by lazy { mapOf(
    "gpt-4o-mini-transcribe" to listOf("en", "yo", "ig", "ha", "an", "ef", "ib", "id", "tv", "ar", "ebz", "ego", "fon", "fr", "igl", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tw", "urh"),
    "whisper-1" to listOf("en", "yo", "ig", "ha", "an", "ef", "ib", "id", "tv", "ar", "ebz", "ego", "fon", "fr", "igl", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tw", "urh"),
    "gpt-4o-transcribe" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "gpt-transcribe" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "gpt-4o-transcribe-diarize" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "auto" to listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy", "an", "ebz", "ef", "ego", "fon", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "tv", "tw", "urh", "yo", "am", "bm", "bem", "ber", "ny", "ee", "ff", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "ss", "ti", "ts", "tn", "umb", "ve", "wo", "xh", "zu", "as", "bn", "ceb", "co", "dv", "eo", "eu", "fil", "fy", "ga", "gd", "gu", "haw", "hmn", "ht", "jv", "ka", "km", "ku", "ky", "la", "lb", "lo", "ml", "mn", "mni-mtei", "mt", "my", "or", "pa", "ps", "sd", "si", "sm", "sq", "su", "te", "tg", "ug", "uz", "yi", "rn", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar-sd", "ar-tn", "mg-plateau"),
    "wspr-small-2025-11-11-12-12--mpk" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "wspr-small-2025-11-11-12-12--mpk-rp" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypaai-whisper-base-v1-04292-lhy" to listOf("en", "yo", "ig", "ha", "an", "ef", "ib", "id", "tv", "ar", "ebz", "ego", "fon", "fr", "igl", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tw", "urh"),
    "hypa-whisper-v2-stream-runpod" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo"),
    "gemini-3.5-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.5-flash-lite" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.8-flash" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "af", "am", "as", "az", "be", "bg", "bn", "bs", "ca", "ceb", "co", "cs", "cy", "da", "de", "dv", "el", "eo", "et", "eu", "fa", "fi", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hi-in", "hmn", "hr", "ht", "hu", "hy", "id-id", "is", "it-it", "ja-jp", "jv", "ka", "kk", "km", "kn", "ko-kr", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "ne", "nl", "no", "ny", "or", "pa", "pl", "ps", "ro", "ru", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "sv", "ta", "te", "tg", "th", "tr", "ug", "uk", "ur", "uz", "vi", "xh", "yi", "zh", "zu"),
    "gemini-3.5-transcribe" to listOf(),
    "mansa-transcribe" to listOf("af", "am", "bm", "bem", "ny", "en", "ee", "ha", "ig", "rw", "rn", "ln", "lg", "mg", "om", "nso", "sn", "so", "sw", "ti", "ts", "tn", "tw", "xh", "yo", "zu", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar", "ar-sd", "ar-tn", "mg-plateau"),
    "scribe_v2" to listOf("en", "yo", "ig", "ha"),
    "muse-voice-transcribe-1.0" to listOf("ar", "bn", "nl", "en", "fr", "de", "he", "hi-in", "id-id", "it-it", "ja-jp", "kn", "ko-kr", "ms", "zh", "mr", "pl", "pt", "es", "fil", "ta", "te", "th", "tr", "vi"),
  ) }

  private val ttsLanguageCodesByModel: Map<String, List<String>> by lazy { mapOf(
    "gpt-4o-mini-tts" to listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy"),
    "tts-1" to listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy"),
    "tts-1-hd" to listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy"),
    "auto" to listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy", "an", "ebz", "ef", "ego", "fon", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "tv", "tw", "urh", "yo", "am", "bm", "bem", "ber", "ny", "ee", "ff", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "ss", "ti", "ts", "tn", "umb", "ve", "wo", "xh", "zu", "as", "bn", "ceb", "co", "dv", "eo", "eu", "fil", "fy", "ga", "gd", "gu", "haw", "hmn", "ht", "jv", "ka", "km", "ku", "ky", "la", "lb", "lo", "ml", "mn", "mni-mtei", "mt", "my", "or", "pa", "ps", "sd", "si", "sm", "sq", "su", "te", "tg", "ug", "uz", "yi", "rn", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar-sd", "ar-tn", "mg-plateau"),
    "hypa-orpheus-3b-tts-vc-flt" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypa-orpheus-3b-tts-vc-flt-rp" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypa-orpheus-3b-tts-vc-ext-izg" to listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "es", "sw", "tv", "tw", "urh", "yo"),
    "hypaai-orpheus-v5-pqq" to listOf("an", "ef", "en", "ha", "ib", "id", "ig", "tv", "yo"),
    "gemini-3.1-flash-tts-preview" to listOf("ar", "en", "fr", "pt", "es", "sw", "hi-in", "id-id", "it-it", "ja-jp", "ko-kr"),
    "gemini-3.8-flash-tts" to listOf("ar", "en", "fr", "pt", "es", "sw", "hi-in", "id-id", "it-it", "ja-jp", "ko-kr"),
    "gemini-3.8-flash-lite-tts" to listOf("ar", "en", "fr", "pt", "es", "sw", "hi-in", "id-id", "it-it", "ja-jp", "ko-kr"),
    "gemini-2.5-pro-tts" to listOf("ar", "en", "fr", "pt", "es", "sw", "hi-in", "id-id", "it-it", "ja-jp", "ko-kr"),
    "mansa-tts" to listOf("af", "am", "ar", "bm", "bem", "ber", "ny", "en", "ee", "fon", "ff", "ha", "ig", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "sw", "ss", "ti", "ts", "tn", "tw", "umb", "ve", "wo", "xh", "yo", "zu"),
    "yarn_gpt" to listOf("en", "pcm", "ha", "yo", "ig"),
    "eleven_v3" to listOf("ar", "en", "fr", "de", "pt", "es", "sw"),
    "eleven_multilingual_v2" to listOf("ar", "en", "fr", "de", "pt", "es"),
    "eleven_flash_v2_5" to listOf("ar", "en", "fr", "de", "pt", "es"),
  ) }

  private val voicesByModelAndCode: Map<String, Map<String, List<String>>> by lazy { mapOf(
    "gpt-4o-mini-tts" to mapOf(
      "en" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "af" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ar" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "hy" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "az" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "be" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "bs" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "bg" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ca" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "zh" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "hr" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "cs" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "da" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "nl" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "et" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "fi" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "fr" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "gl" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "de" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "el" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "he" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "hi-in" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "hu" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "is" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "id-id" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "it-it" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ja-jp" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "kn" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "kk" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ko-kr" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "lv" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "lt" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "mk" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ms" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "mi" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "mr" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ne" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "no" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "fa" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "pl" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "pt" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ro" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ru" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "sr" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "sk" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "sl" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "es" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "sw" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "sv" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ta" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "th" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "tr" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "uk" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "ur" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "vi" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
      "cy" to listOf("alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"),
    ),
    "tts-1" to mapOf(
      "en" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "af" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ar" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hy" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "az" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "be" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "bs" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "bg" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ca" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "zh" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "cs" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "da" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "nl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "et" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "fi" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "fr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "gl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "de" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "el" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "he" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hi-in" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hu" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "is" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "id-id" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "it-it" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ja-jp" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "kn" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "kk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ko-kr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "lv" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "lt" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "mk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ms" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "mi" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "mr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ne" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "no" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "fa" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "pl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "pt" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ro" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ru" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "es" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sw" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sv" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ta" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "th" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "tr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "uk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ur" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "vi" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "cy" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
    ),
    "tts-1-hd" to mapOf(
      "en" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "af" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ar" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hy" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "az" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "be" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "bs" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "bg" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ca" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "zh" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "cs" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "da" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "nl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "et" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "fi" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "fr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "gl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "de" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "el" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "he" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hi-in" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "hu" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "is" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "id-id" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "it-it" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ja-jp" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "kn" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "kk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ko-kr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "lv" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "lt" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "mk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ms" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "mi" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "mr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ne" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "no" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "fa" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "pl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "pt" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ro" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ru" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sl" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "es" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sw" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "sv" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ta" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "th" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "tr" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "uk" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "ur" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "vi" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
      "cy" to listOf("alloy", "ash", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"),
    ),
    "hypa-orpheus-3b-tts-vc-flt" to mapOf(
      "an" to listOf("Deborah", "Enoima", "Inimform", "Ntakidara", "Uduak", "Utibeima"),
      "ar" to listOf("Aliyu", "Dauda", "Idrees", "Rufa'i"),
      "ebz" to listOf("Amoto"),
      "ef" to listOf("Augustine", "Beatrice", "Daniel", "ImaBong", "Imaobong", "Jemimah", "Kooffreh", "Lilly", "Tabitha", "Udofot", "Umoh"),
      "ego" to listOf("Esla", "Faith"),
      "en" to listOf("Eniola", "tara", "Alloy", "Juliet", "Beatrice", "Eunice", "dan", "leah", "jess", "leo", "mia", "zac", "zoe"),
      "fon" to listOf("Assogba", "Mahutin", "Sèdjlo"),
      "fr" to listOf("Adaugo", "Alloy", "Balah", "Ballad", "Biakath", "Doualla", "Mercy", "Nguekem", "Prisca", "Randy", "Woubinwou"),
      "ha" to listOf("Juliet", "Asha", "Elisha", "Emmanuel", "Eunice", "Fatima", "Tapshak"),
      "ib" to listOf("Aitee", "Albert", "Comfort", "Edet", "Harrison"),
      "id" to listOf("Edache", "Ochekwu", "Roseline", "Shettima"),
      "igl" to listOf("Ojochegbe", "Ojodunwene", "Omachoko", "Zainab"),
      "ige" to listOf(),
      "ig" to listOf("Amarachi", "Chinenye", "Enoch", "Gift", "Henrietta", "Oluchukwu", "Prince"),
      "nup" to listOf("Alhassan", "Isah"),
      "pcm" to listOf("Prince", "Eniola", "Asha", "Favour"),
      "pt" to listOf("Gbamwuan", "Hakeemat", "Salvador", "Temitope"),
      "es" to listOf("Alloy", "Ash", "Ballad", "Coral", "Karin", "Light", "Sokoudjou", "Ubenga", "Valeria"),
      "sw" to listOf("Kamau", "Kamojo", "Kangethe", "Lealo", "Lukoye", "Mukami", "Muriuki", "Njeri", "Siwa", "Wambui", "Wanjiru"),
      "tv" to listOf("David", "Fabian", "Ilioko", "Mercie", "Tovshima", "Victor"),
      "tw" to listOf("Nyarkoh"),
      "urh" to listOf("Happy"),
      "yo" to listOf("Eniola", "Favour", "Gbemisola", "Moyo", "Nofisat", "Olushola", "Oyeniyi", "Pauline", "Toyin"),
    ),
    "hypa-orpheus-3b-tts-vc-flt-rp" to mapOf(
      "an" to listOf("Deborah", "Enoima", "Inimform", "Ntakidara", "Uduak", "Utibeima"),
      "ar" to listOf("Aliyu", "Dauda", "Idrees", "Rufa'i"),
      "ebz" to listOf("Amoto"),
      "ef" to listOf("Augustine", "Beatrice", "Daniel", "ImaBong", "Imaobong", "Jemimah", "Kooffreh", "Lilly", "Tabitha", "Udofot", "Umoh"),
      "ego" to listOf("Esla", "Faith"),
      "en" to listOf("Eniola", "tara", "Alloy", "Juliet", "Beatrice", "Eunice", "dan", "leah", "jess", "leo", "mia", "zac", "zoe"),
      "fon" to listOf("Assogba", "Mahutin", "Sèdjlo"),
      "fr" to listOf("Adaugo", "Alloy", "Balah", "Ballad", "Biakath", "Doualla", "Mercy", "Nguekem", "Prisca", "Randy", "Woubinwou"),
      "ha" to listOf("Juliet", "Asha", "Elisha", "Emmanuel", "Eunice", "Fatima", "Tapshak"),
      "ib" to listOf("Aitee", "Albert", "Comfort", "Edet", "Harrison"),
      "id" to listOf("Edache", "Ochekwu", "Roseline", "Shettima"),
      "igl" to listOf("Ojochegbe", "Ojodunwene", "Omachoko", "Zainab"),
      "ige" to listOf(),
      "ig" to listOf("Amarachi", "Chinenye", "Enoch", "Gift", "Henrietta", "Oluchukwu", "Prince"),
      "nup" to listOf("Alhassan", "Isah"),
      "pcm" to listOf("Prince", "Eniola", "Asha", "Favour"),
      "pt" to listOf("Gbamwuan", "Hakeemat", "Salvador", "Temitope"),
      "es" to listOf("Alloy", "Ash", "Ballad", "Coral", "Karin", "Light", "Sokoudjou", "Ubenga", "Valeria"),
      "sw" to listOf("Kamau", "Kamojo", "Kangethe", "Lealo", "Lukoye", "Mukami", "Muriuki", "Njeri", "Siwa", "Wambui", "Wanjiru"),
      "tv" to listOf("David", "Fabian", "Ilioko", "Mercie", "Tovshima", "Victor"),
      "tw" to listOf("Nyarkoh"),
      "urh" to listOf("Happy"),
      "yo" to listOf("Eniola", "Favour", "Gbemisola", "Moyo", "Nofisat", "Olushola", "Oyeniyi", "Pauline", "Toyin"),
    ),
    "hypa-orpheus-3b-tts-vc-ext-izg" to mapOf(
      "an" to listOf("Deborah", "Enoima", "Inimform", "Ntakidara", "Uduak", "Utibeima"),
      "ar" to listOf("Aliyu", "Dauda", "Idrees", "Rufa'i"),
      "ebz" to listOf("Amoto"),
      "ef" to listOf("Augustine", "Beatrice", "Daniel", "ImaBong", "Imaobong", "Jemimah", "Kooffreh", "Lilly", "Tabitha", "Udofot", "Umoh"),
      "ego" to listOf("Esla", "Faith"),
      "en" to listOf("Eniola", "tara", "Alloy", "Juliet", "Beatrice", "Eunice", "dan", "leah", "jess", "leo", "mia", "zac", "zoe"),
      "fon" to listOf("Assogba", "Mahutin", "Sèdjlo"),
      "fr" to listOf("Adaugo", "Alloy", "Balah", "Ballad", "Biakath", "Doualla", "Mercy", "Nguekem", "Prisca", "Randy", "Woubinwou"),
      "ha" to listOf("Juliet", "Asha", "Elisha", "Emmanuel", "Eunice", "Fatima", "Tapshak"),
      "ib" to listOf("Aitee", "Albert", "Comfort", "Edet", "Harrison"),
      "id" to listOf("Edache", "Ochekwu", "Roseline", "Shettima"),
      "igl" to listOf("Ojochegbe", "Ojodunwene", "Omachoko", "Zainab"),
      "ige" to listOf(),
      "ig" to listOf("Amarachi", "Chinenye", "Enoch", "Gift", "Henrietta", "Oluchukwu", "Prince"),
      "nup" to listOf("Alhassan", "Isah"),
      "pcm" to listOf("Prince", "Eniola", "Asha", "Favour"),
      "pt" to listOf("Gbamwuan", "Hakeemat", "Salvador", "Temitope"),
      "es" to listOf("Alloy", "Ash", "Ballad", "Coral", "Karin", "Light", "Sokoudjou", "Ubenga", "Valeria"),
      "sw" to listOf("Kamau", "Kamojo", "Kangethe", "Lealo", "Lukoye", "Mukami", "Muriuki", "Njeri", "Siwa", "Wambui", "Wanjiru"),
      "tv" to listOf("David", "Fabian", "Ilioko", "Mercie", "Tovshima", "Victor"),
      "tw" to listOf("Nyarkoh"),
      "urh" to listOf("Happy"),
      "yo" to listOf("Eniola", "Favour", "Gbemisola", "Moyo", "Nofisat", "Olushola", "Oyeniyi", "Pauline", "Toyin"),
    ),
    "hypaai-orpheus-v5-pqq" to mapOf(
      "an" to listOf("Utibeima", "Deborah", "Enoima"),
      "ef" to listOf("Beatrice", "Kooffreh"),
      "en" to listOf("Juliet", "Eniola", "zac", "tara", "leah", "jess", "leo", "dan", "mia", "zoe"),
      "ha" to listOf("Juliet", "Emmanuel", "Eunice", "Tapshak"),
      "ib" to listOf("Aitee"),
      "id" to listOf("Shettima", "Edache"),
      "ig" to listOf("Henrietta", "Lovelyn", "Prince"),
      "tv" to listOf("Victor", "Mercie", "David"),
      "yo" to listOf("Eniola", "Moyo", "Gbemisola", "Pauline", "Toyin"),
    ),
    "gemini-3.1-flash-tts-preview" to mapOf(
      "ar" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "en" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "fr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "pt" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "es" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "sw" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "hi-in" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "id-id" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "it-it" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ja-jp" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ko-kr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
    ),
    "gemini-3.8-flash-tts" to mapOf(
      "ar" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "en" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "fr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "pt" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "es" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "sw" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "hi-in" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "id-id" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "it-it" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ja-jp" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ko-kr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
    ),
    "gemini-3.8-flash-lite-tts" to mapOf(
      "ar" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "en" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "fr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "pt" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "es" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "sw" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "hi-in" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "id-id" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "it-it" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ja-jp" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ko-kr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
    ),
    "gemini-2.5-pro-tts" to mapOf(
      "ar" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "en" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "fr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "pt" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "es" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "sw" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "hi-in" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "id-id" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "it-it" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ja-jp" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
      "ko-kr" to listOf("Achernar", "Achird", "Algenib", "Algieba", "Alnilam", "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina", "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus", "Kore", "Laomedeia", "Leda", "Orus", "Pulcherrima", "Puck", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar", "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"),
    ),
    "mansa-tts" to mapOf(
      "af" to listOf("male", "female"),
      "am" to listOf("male", "female"),
      "ar" to listOf("male", "female"),
      "bm" to listOf("male", "female"),
      "bem" to listOf("male", "female"),
      "ber" to listOf("male", "female"),
      "ny" to listOf("male", "female"),
      "ee" to listOf("male", "female"),
      "fon" to listOf("male", "female"),
      "ff" to listOf("male", "female"),
      "ha" to listOf("male", "female"),
      "ig" to listOf("male", "female"),
      "kr" to listOf("male", "female"),
      "ki" to listOf("male", "female"),
      "rw" to listOf("male", "female"),
      "kri" to listOf("male", "female"),
      "ln" to listOf("male", "female"),
      "lg" to listOf("male", "female"),
      "mg" to listOf("male", "female"),
      "nr" to listOf("male", "female"),
      "om" to listOf("male", "female"),
      "nso" to listOf("male", "female"),
      "st" to listOf("male", "female"),
      "sn" to listOf("male", "female"),
      "so" to listOf("male", "female"),
      "sw" to listOf("male", "female"),
      "ss" to listOf("male", "female"),
      "ti" to listOf("male", "female"),
      "ts" to listOf("male", "female"),
      "tn" to listOf("male", "female"),
      "tw" to listOf("male", "female"),
      "umb" to listOf("male", "female"),
      "ve" to listOf("male", "female"),
      "wo" to listOf("male", "female"),
      "xh" to listOf("male", "female"),
      "yo" to listOf("male", "female"),
      "zu" to listOf("male", "female"),
      "en" to listOf("male", "female", "nigerian_male", "nigerian_female", "ghanaian_male", "ghanaian_female", "east_african_male", "east_african_female", "north_african_male", "north_african_female", "south_african_male", "south_african_female", "igbo_male_speaker", "igbo_female_speaker", "yoruba_male_speaker", "yoruba_female_speaker", "hausa_male_speaker", "hausa_female_speaker", "twi_male_speaker", "twi_female_speaker", "kanuri_male_speaker", "kanuri_female_speaker", "fula_male_speaker", "fula_female_speaker", "ewe_male_speaker", "ewe_female_speaker", "fon_male_speaker", "fon_female_speaker", "bambara_male_speaker", "bambara_female_speaker", "wolof_male_speaker", "wolof_female_speaker", "krio_male_speaker", "krio_female_speaker", "swahili_male_speaker", "swahili_female_speaker", "kikuyu_male_speaker", "kikuyu_female_speaker", "luganda_male_speaker", "luganda_female_speaker", "kinyarwanda_male_speaker", "kinyarwanda_female_speaker", "amharic_male_speaker", "amharic_female_speaker", "oromo_male_speaker", "oromo_female_speaker", "tigrinya_male_speaker", "tigrinya_female_speaker", "somali_male_speaker", "somali_female_speaker", "malagasy_male_speaker", "malagasy_female_speaker", "xhosa_male_speaker", "xhosa_female_speaker", "zulu_male_speaker", "zulu_female_speaker", "afrikaans_male_speaker", "afrikaans_female_speaker", "tswana_male_speaker", "tswana_female_speaker", "sesotho_male_speaker", "sesotho_female_speaker", "sepedi_male_speaker", "sepedi_female_speaker", "venda_male_speaker", "venda_female_speaker", "swati_male_speaker", "swati_female_speaker", "shona_male_speaker", "shona_female_speaker", "chichewa_male_speaker", "chichewa_female_speaker", "tsonga_male_speaker", "tsonga_female_speaker", "ndebele_male_speaker", "ndebele_female_speaker", "bemba_male_speaker", "bemba_female_speaker", "umbundu_male_speaker", "umbundu_female_speaker", "lingala_male_speaker", "lingala_female_speaker", "arabic_male_speaker", "arabic_female_speaker", "berber_male_speaker", "berber_female_speaker"),
    ),
    "yarn_gpt" to mapOf(
      "en" to listOf("idera", "emma", "zainab", "osagie", "wura", "jude", "chinenye", "tayo", "regina", "femi", "adaora", "umar", "mary", "nonso", "remi", "adam"),
      "pcm" to listOf("idera", "emma", "zainab", "osagie", "wura", "jude", "chinenye", "tayo", "regina", "femi", "adaora", "umar", "mary", "nonso", "remi", "adam"),
      "ha" to listOf("idera", "emma", "zainab", "osagie", "wura", "jude", "chinenye", "tayo", "regina", "femi", "adaora", "umar", "mary", "nonso", "remi", "adam"),
      "yo" to listOf("idera", "emma", "zainab", "osagie", "wura", "jude", "chinenye", "tayo", "regina", "femi", "adaora", "umar", "mary", "nonso", "remi", "adam"),
      "ig" to listOf("idera", "emma", "zainab", "osagie", "wura", "jude", "chinenye", "tayo", "regina", "femi", "adaora", "umar", "mary", "nonso", "remi", "adam"),
    ),
    "eleven_v3" to mapOf(
      "en" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "ar" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "de" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "sw" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "fr" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "es" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "pt" to listOf("Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
    ),
    "eleven_multilingual_v2" to mapOf(
      "ar" to listOf("Masry", "Hamid", "Jeddawi", "Hamida", "Mazen", "Sara", "Anas", "Chaouki", "Ghizlane", "Haytham", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "en" to listOf("Young Jamal", "Brittney", "Mark", "Allison", "Hope Upbeat", "Amelia", "Hope Natural", "Zara", "Jon", "Christopher", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "fr" to listOf("Nicolas", "Audrey", "Claire", "Hélène", "Jeanne", "Lucie", "Clara", "Maevys", "Theo", "Victoria", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "es" to listOf("Cristina", "Norah", "Fernando", "Alberto", "Andrea", "Dan", "Tatiana", "MariCarmen", "Johnny", "Alejandro", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "pt" to listOf("Keren", "Matheus", "Will Deep", "Wesley", "Amandoca", "Dhyogo", "Diego", "Ana", "Roberta", "Raquel", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "de" to listOf("Susi", "Lea", "Carola", "Otto", "Ava", "Ben", "Annika", "Niander", "Luisa", "Isabell", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
    ),
    "eleven_flash_v2_5" to mapOf(
      "ar" to listOf("Masry", "Hamid", "Jeddawi", "Hamida", "Mazen", "Sara", "Anas", "Chaouki", "Ghizlane", "Haytham", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "en" to listOf("Mark", "Allison", "Hope Upbeat", "Amelia", "Hope Natural", "Zara", "Jon", "Christopher", "Peter", "Andrew", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "fr" to listOf("Nicolas", "Audrey", "Claire", "Hélène", "Jeanne", "Lucie", "Clara", "Maevys", "Theo", "Victoria", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "es" to listOf("Cristina", "Norah", "Fernando", "Alberto", "Andrea", "Dan", "Tatiana", "MariCarmen", "Johnny", "Alejandro", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "pt" to listOf("Matheus", "Will Deep", "Wesley", "Amandoca", "Dhyogo", "Diego", "Ana", "Roberta", "Raquel", "Borges", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
      "de" to listOf("Susi", "Lea", "Carola", "Otto", "Ava", "Ben", "Annika", "Niander", "Luisa", "Isabell", "Bella", "Roger", "Sarah", "Laura", "Charlie", "George", "Callum", "River", "Harry", "Liam", "Alice", "Matilda", "Will", "Jessica", "Eric", "Chris", "Brian", "Daniel", "Lily", "Adam", "Bill"),
    ),
  ) }

  private val keyboardAlphabetRowsByCode: Map<String, List<List<String>>> by lazy { mapOf(
    "en" to listOf(listOf("q", "w", "e", "r", "t", "y", "u", "i", "o", "p"), listOf("a", "s", "d", "f", "g", "h", "j", "k", "l"), listOf("z", "x", "c", "v", "b", "n", "m")),
    "yo" to listOf(listOf("q", "w", "ẹ", "r", "t", "y", "u", "i", "ọ", "p"), listOf("a", "ṣ", "d", "f", "g", "h", "j", "k", "l"), listOf("z", "x", "c", "v", "b", "n", "m")),
    "igl" to listOf(listOf("q", "w", "ẹ", "r", "t", "y", "u", "i", "ọ", "p"), listOf("a", "ṣ", "d", "f", "g", "h", "j", "k", "l"), listOf("z", "x", "c", "v", "b", "n", "m")),
    "ig" to listOf(listOf("q", "w", "ẹ", "r", "t", "y", "ụ", "ị", "ọ", "p"), listOf("a", "s", "d", "f", "g", "h", "j", "k", "l"), listOf("z", "x", "c", "v", "b", "n", "m")),
    "ha" to listOf(listOf("q", "w", "e", "r", "t", "ƴ", "u", "i", "o", "p"), listOf("a", "s", "ɗ", "f", "g", "h", "j", "ƙ", "l"), listOf("z", "x", "c", "v", "ɓ", "n", "m")),
  ) }

  private val keyboardAlternatePopupsByCode: Map<String, Map<String, List<String>>> by lazy { mapOf(
    "yo" to mapOf(
      "ẹ" to listOf("e", "ẹ́", "ẹ̀", "ẹ̄", "é", "è", "ē"),
      "ọ" to listOf("o", "ọ́", "ọ̀", "ọ̄", "ó", "ò", "ō"),
      "ṣ" to listOf("s"),
      "a" to listOf("à", "á", "ā"),
      "i" to listOf("ì", "í", "ī"),
      "u" to listOf("ù", "ú", "ū"),
      "n" to listOf("ń", "ǹ", "n̄"),
      "m" to listOf("ḿ", "m̀", "m̄"),
      "g" to listOf("gb"),
    ),
    "igl" to mapOf(
      "ẹ" to listOf("e", "ẹ́", "ẹ̀", "ẹ̄", "é", "è", "ē"),
      "ọ" to listOf("o", "ọ́", "ọ̀", "ọ̄", "ó", "ò", "ō"),
      "ṣ" to listOf("s"),
      "a" to listOf("à", "á", "ā"),
      "i" to listOf("ì", "í", "ī"),
      "u" to listOf("ù", "ú", "ū"),
      "n" to listOf("ń", "ǹ", "n̄"),
      "m" to listOf("ḿ", "m̀", "m̄"),
      "g" to listOf("gb"),
    ),
    "ig" to mapOf(
      "ị" to listOf("i", "ị́", "ị̀", "ị̄", "í", "ì", "ī"),
      "ọ" to listOf("o", "ọ́", "ọ̀", "ọ̄", "ó", "ò", "ō"),
      "ụ" to listOf("u", "ụ́", "ụ̀", "ụ̄", "ú", "ù", "ū"),
      "a" to listOf("á", "à", "ā"),
      "ẹ" to listOf("e", "ẹ́", "ẹ̀", "ẹ̄", "é", "è", "ē"),
      "n" to listOf("ṅ", "ñ", "nw", "ny", "ń", "ǹ", "n̄"),
      "m" to listOf("ḿ", "m̀", "m̄"),
      "c" to listOf("ch"),
      "g" to listOf("gb", "gh", "gw"),
      "k" to listOf("kp", "kw"),
      "s" to listOf("sh"),
    ),
    "ha" to mapOf(
      "ɓ" to listOf("b"),
      "ɗ" to listOf("d"),
      "ƙ" to listOf("k", "ƙw", "ƙy", "kw", "ky"),
      "ƴ" to listOf("y", "ʼy", "ʼ"),
      "s" to listOf("sh"),
      "t" to listOf("ts"),
      "g" to listOf("gw", "gy"),
    ),
  ) }

  private val legacyCodes: Map<String, String> by lazy { mapOf(
    "tiv" to "tv",
    "ann" to "an",
    "efi" to "ef",
    "ibb" to "ib",
    "idu" to "id",
    "en-us" to "en",
  ) }

  fun canonicalCode(code: String): String {
    val normalized = code.trim().lowercase()
    return legacyCodes[normalized] ?: normalized
  }

  fun language(code: String): TranslationLanguage? {
    val canonical = canonicalCode(code)
    if (canonical == autoDetect.code) return autoDetect
    return allLanguages.firstOrNull { it.code.equals(canonical, ignoreCase = true) }
  }

  fun languageByName(name: String): TranslationLanguage? {
    if (
      name.equals(autoDetect.name, ignoreCase = true) ||
        name.equals("Auto Detect", ignoreCase = true)
    ) {
      return autoDetect
    }
    return allLanguages.firstOrNull { it.name.equals(name, ignoreCase = true) }
  }

  fun languages(model: String): List<TranslationLanguage> {
    val codes =
      translationLanguageCodesByModel[model]
        ?: languageCodesByModel[model]
        ?: listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh", "hu", "ro", "th", "tr", "uk", "vi", "af", "am", "as", "az", "be", "bg", "bs", "ca", "ceb", "co", "cy", "dv", "eo", "et", "eu", "fa", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hmn", "hr", "hy", "is", "jv", "ka", "kk", "km", "kn", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "no", "ny", "or", "pa", "ps", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "te", "tg", "ug", "ur", "uz", "xh", "yi", "zu", "bm", "bem", "ee", "kg", "rw", "rn", "ln", "lg", "nr", "om", "nso", "ss", "ti", "ts", "tn")
    val selected = languagesFromCodes(codes)
    return selected.ifEmpty { languagesFromCodes(listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh", "hu", "ro", "th", "tr", "uk", "vi", "af", "am", "as", "az", "be", "bg", "bs", "ca", "ceb", "co", "cy", "dv", "eo", "et", "eu", "fa", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hmn", "hr", "hy", "is", "jv", "ka", "kk", "km", "kn", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "no", "ny", "or", "pa", "ps", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "te", "tg", "ug", "ur", "uz", "xh", "yi", "zu", "bm", "bem", "ee", "kg", "rw", "rn", "ln", "lg", "nr", "om", "nso", "ss", "ti", "ts", "tn")) }
  }

  fun translationSourceLanguages(model: String): List<TranslationLanguage> =
    listOf(autoDetect) + languages(model)

  fun translationTargetLanguages(model: String): List<TranslationLanguage> = languages(model)

  fun keyboardLayoutLanguages(model: String): List<TranslationLanguage> = languages(model)

  fun dictionaryLanguages(model: String): List<TranslationLanguage> {
    val codes =
      dictionaryLanguageCodesByModel[model]
        ?: languageCodesByModel[model]
        ?: listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh", "hu", "ro", "th", "tr", "uk", "vi", "af", "am", "as", "az", "be", "bg", "bs", "ca", "ceb", "co", "cy", "dv", "eo", "et", "eu", "fa", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hmn", "hr", "hy", "is", "jv", "ka", "kk", "km", "kn", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "no", "ny", "or", "pa", "ps", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "te", "tg", "ug", "ur", "uz", "xh", "yi", "zu", "bm", "bem", "ee", "kg", "rw", "rn", "ln", "lg", "nr", "om", "nso", "ss", "ti", "ts", "tn")
    val selected = languagesFromCodes(codes)
    return selected.ifEmpty { languagesFromCodes(listOf("an", "ar", "ebz", "ef", "ego", "en", "fon", "fr", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "pt", "so", "es", "sw", "tv", "tw", "urh", "yo", "aii", "bn", "cs", "da", "de", "el", "fi", "gaq", "hi-in", "ht", "id-id", "it-it", "ja-jp", "kgk", "ko-kr", "lif", "mpj", "ne", "nl", "pl", "ru", "sv", "ta", "tzo", "usa", "wbi", "zh", "hu", "ro", "th", "tr", "uk", "vi", "af", "am", "as", "az", "be", "bg", "bs", "ca", "ceb", "co", "cy", "dv", "eo", "et", "eu", "fa", "fil", "fy", "ga", "gd", "gl", "gu", "haw", "he", "hmn", "hr", "hy", "is", "jv", "ka", "kk", "km", "kn", "kri", "ku", "ky", "la", "lb", "lo", "lt", "lv", "mg", "mi", "mk", "ml", "mn", "mni-mtei", "mr", "ms", "mt", "my", "no", "ny", "or", "pa", "ps", "sd", "si", "sk", "sl", "sm", "sn", "sq", "sr", "st", "su", "te", "tg", "ug", "ur", "uz", "xh", "yi", "zu", "bm", "bem", "ee", "kg", "rw", "rn", "ln", "lg", "nr", "om", "nso", "ss", "ti", "ts", "tn")) }
  }

  fun sttLanguages(model: String): List<TranslationLanguage> {
    val codes = sttLanguageCodesByModel[model] ?: listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy", "an", "ebz", "ef", "ego", "fon", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "tv", "tw", "urh", "yo", "am", "bm", "bem", "ber", "ny", "ee", "ff", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "ss", "ti", "ts", "tn", "umb", "ve", "wo", "xh", "zu", "as", "bn", "ceb", "co", "dv", "eo", "eu", "fil", "fy", "ga", "gd", "gu", "haw", "hmn", "ht", "jv", "ka", "km", "ku", "ky", "la", "lb", "lo", "ml", "mn", "mni-mtei", "mt", "my", "or", "pa", "ps", "sd", "si", "sm", "sq", "su", "te", "tg", "ug", "uz", "yi", "rn", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar-sd", "ar-tn", "mg-plateau")
    val selected = languagesFromCodes(codes)
    return listOf(autoDetect) +
      selected.ifEmpty { languagesFromCodes(listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy", "an", "ebz", "ef", "ego", "fon", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "tv", "tw", "urh", "yo", "am", "bm", "bem", "ber", "ny", "ee", "ff", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "ss", "ti", "ts", "tn", "umb", "ve", "wo", "xh", "zu", "as", "bn", "ceb", "co", "dv", "eo", "eu", "fil", "fy", "ga", "gd", "gu", "haw", "hmn", "ht", "jv", "ka", "km", "ku", "ky", "la", "lb", "lo", "ml", "mn", "mni-mtei", "mt", "my", "or", "pa", "ps", "sd", "si", "sm", "sq", "su", "te", "tg", "ug", "uz", "yi", "rn", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar-sd", "ar-tn", "mg-plateau")) }
  }

  fun ttsLanguages(model: String): List<TranslationLanguage> {
    val codes = ttsLanguageCodesByModel[model] ?: listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy", "an", "ebz", "ef", "ego", "fon", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "tv", "tw", "urh", "yo", "am", "bm", "bem", "ber", "ny", "ee", "ff", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "ss", "ti", "ts", "tn", "umb", "ve", "wo", "xh", "zu", "as", "bn", "ceb", "co", "dv", "eo", "eu", "fil", "fy", "ga", "gd", "gu", "haw", "hmn", "ht", "jv", "ka", "km", "ku", "ky", "la", "lb", "lo", "ml", "mn", "mni-mtei", "mt", "my", "or", "pa", "ps", "sd", "si", "sm", "sq", "su", "te", "tg", "ug", "uz", "yi", "rn", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar-sd", "ar-tn", "mg-plateau")
    val selected = languagesFromCodes(codes)
    return selected.ifEmpty { languagesFromCodes(listOf("en", "af", "ar", "hy", "az", "be", "bs", "bg", "ca", "zh", "hr", "cs", "da", "nl", "et", "fi", "fr", "gl", "de", "el", "he", "hi-in", "hu", "is", "id-id", "it-it", "ja-jp", "kn", "kk", "ko-kr", "lv", "lt", "mk", "ms", "mi", "mr", "ne", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl", "es", "sw", "sv", "ta", "th", "tr", "uk", "ur", "vi", "cy", "an", "ebz", "ef", "ego", "fon", "ha", "ib", "id", "igl", "ig", "ige", "nup", "pcm", "tv", "tw", "urh", "yo", "am", "bm", "bem", "ber", "ny", "ee", "ff", "kr", "ki", "rw", "kri", "ln", "lg", "mg", "nr", "om", "nso", "st", "sn", "so", "ss", "ti", "ts", "tn", "umb", "ve", "wo", "xh", "zu", "as", "bn", "ceb", "co", "dv", "eo", "eu", "fil", "fy", "ga", "gd", "gu", "haw", "hmn", "ht", "jv", "ka", "km", "ku", "ky", "la", "lb", "lo", "ml", "mn", "mni-mtei", "mt", "my", "or", "pa", "ps", "sd", "si", "sm", "sq", "su", "te", "tg", "ug", "uz", "yi", "rn", "ar-dz", "ar-eg", "ar-ly", "ar-ma", "ar-sd", "ar-tn", "mg-plateau")) }
  }

  fun voices(languageCode: String, model: String): List<String> =
    voicesByModelAndCode[model]?.get(canonicalCode(languageCode)).orEmpty()

  fun ttsVoices(languageCode: String, model: String): List<String> {
    val available = voices(languageCode, model)
    if (available.isNotEmpty()) return available
    for (language in ttsLanguages(model)) {
      val fallback = voices(language.code, model)
      if (fallback.isNotEmpty()) return fallback
    }
    return emptyList()
  }

  fun alphabetRows(languageCode: String): List<List<String>> =
    keyboardAlphabetRowsByCode[canonicalCode(languageCode)]
      ?: keyboardAlphabetRowsByCode["en"]
      ?: emptyList()

  fun hasCustomLayout(languageCode: String): Boolean =
    keyboardAlphabetRowsByCode.containsKey(canonicalCode(languageCode))

  private val modelNamesByServiceAndProvider: Map<String, Map<String, List<String>>> by lazy { mapOf(
    "MT" to mapOf(
      "openai" to listOf("gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-6-astra", "gpt-4o-mini", "gpt-5-nano"),
      "hypaai" to listOf("auto", "Hypa-Llama3.1-8b-SFT", "Hypa-Llama3.1-8b-SFT-RP", "hypa-llama3-2-8b-sft-2025-12-rvl"),
      "google" to listOf("google/gemma-4-31B-it:novita", "google/gemma-4-26B-A4B-it:novita", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"),
      "mansa" to listOf("mansa-translate"),
      "meta" to listOf("muse-spark-1.3", "muse-spark-1.2", "muse-wonder-1.0", "meta-models/Muse-Spark-Open-816B-A42B:baseten", "meta-models/Muse-Glimmer-30B:deepinfra", "meta-llama/Llama-4-Scout-17B-16E-Instruct:nscale", "meta-llama/Llama-3.3-70B-Instruct:scaleway", "meta-llama/Llama-3.1-8B-Instruct:deepinfra"),
      "nous" to listOf("NousResearch/Hermes-3-Llama-3.1-70B:featherless-ai"),
    ),
    "AC" to mapOf(
      "openai" to listOf("gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-6-astra"),
      "hypaai" to listOf("Hypa-Llama3.1-8b-SFT", "Hypa-Llama3.1-8b-SFT-RP", "hypa-llama3-2-8b-sft-2025-12-rvl"),
      "google" to listOf("google/gemma-4-31B-it:novita", "google/gemma-4-26B-A4B-it:novita", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash"),
      "meta" to listOf("muse-spark-1.3", "muse-spark-1.2", "muse-wonder-1.0", "meta-models/Muse-Spark-Open-816B-A42B:baseten", "meta-models/Muse-Glimmer-30B:deepinfra", "meta-llama/Llama-4-Scout-17B-16E-Instruct:nscale", "meta-llama/Llama-3.3-70B-Instruct:scaleway", "meta-llama/Llama-3.1-8B-Instruct:deepinfra"),
      "nous" to listOf("NousResearch/Hermes-3-Llama-3.1-70B:featherless-ai"),
    ),
    "TTS" to mapOf(
      "openai" to listOf("gpt-4o-mini-tts", "tts-1", "tts-1-hd"),
      "hypaai" to listOf("auto", "hypa-orpheus-3b-tts-vc-flt", "hypa-orpheus-3b-tts-vc-flt-rp", "hypa-orpheus-3b-tts-vc-ext-izg", "hypaai-orpheus-v5-pqq"),
      "google" to listOf("gemini-3.1-flash-tts-preview", "gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts", "gemini-2.5-pro-tts"),
      "mansa" to listOf("mansa-tts"),
      "yarnGPT" to listOf("yarn_gpt"),
      "elevenlabs" to listOf("eleven_v3", "eleven_multilingual_v2", "eleven_flash_v2_5"),
    ),
    "ASR" to mapOf(
      "openai" to listOf("gpt-4o-mini-transcribe", "whisper-1", "gpt-4o-transcribe", "gpt-transcribe", "gpt-4o-transcribe-diarize"),
      "hypaai" to listOf("auto", "wspr-small-2025-11-11-12-12--mpk", "wspr-small-2025-11-11-12-12--mpk-rp", "hypaai-whisper-base-v1-04292-lhy", "hypa-whisper-v2-stream-runpod"),
      "google" to listOf("gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-3.5-transcribe"),
      "mansa" to listOf("mansa-transcribe"),
      "elevenlabs" to listOf("scribe_v2"),
      "meta" to listOf("muse-voice-transcribe-1.0"),
    ),
  ) }

  fun resolveServiceModel(
    service: String,
    selectedProvider: String,
    selectedModel: String,
  ): ServiceModelSelection {
    val provider = selectedProvider.trim()
    val model = selectedModel.trim()
    val providerModels = modelNamesByServiceAndProvider[service]?.get(provider).orEmpty()
    if (providerModels.isNotEmpty()) {
      return ServiceModelSelection(
        provider,
        if (providerModels.contains(model)) model else providerModels.first(),
      )
    }
    val fallbackModels = modelNamesByServiceAndProvider[service]?.get(defaultProviderName).orEmpty()
    return ServiceModelSelection(defaultProviderName, fallbackModels.first())
  }

  fun resolveTranslation(selectedProvider: String, selectedModel: String): ServiceModelSelection =
    resolveServiceModel("MT", selectedProvider, selectedModel)

  fun resolveDictionary(selectedProvider: String, selectedModel: String): ServiceModelSelection =
    resolveServiceModel("AC", selectedProvider, selectedModel)

  fun resolveTts(selectedProvider: String, selectedModel: String): ServiceModelSelection =
    resolveServiceModel("TTS", selectedProvider, selectedModel)

  // "auto" is the auto router. Send that pair so the API picks the model.
  fun resolveStt(selectedProvider: String, selectedModel: String): ServiceModelSelection {
    if (selectedProvider.equals("auto", ignoreCase = true) ||
      selectedModel.equals("auto", ignoreCase = true)) {
      return ServiceModelSelection("auto", "auto")
    }
    return resolveServiceModel("ASR", selectedProvider, selectedModel)
  }

  private val alternateCaseForms: Map<String, List<String>> by lazy { mapOf(
    "b" to listOf("B", "B"),
    "d" to listOf("D", "D"),
    "k" to listOf("K", "K"),
    "y" to listOf("Y", "Y"),
    "ƴ" to listOf("Ƴ", "Ƴ"),
    "ʼ" to listOf("ʼ", "ʼ"),
    "ʼy" to listOf("ʼY", "ʼY"),
    "ƙw" to listOf("Ƙw", "ƘW"),
    "ƙy" to listOf("Ƙy", "ƘY"),
    "gy" to listOf("Gy", "GY"),
    "ky" to listOf("Ky", "KY"),
    "e" to listOf("E", "E"),
    "o" to listOf("O", "O"),
    "s" to listOf("S", "S"),
    "ẹ́" to listOf("Ẹ́", "Ẹ́"),
    "ẹ̀" to listOf("Ẹ̀", "Ẹ̀"),
    "ẹ̄" to listOf("Ẹ̄", "Ẹ̄"),
    "ọ́" to listOf("Ọ́", "Ọ́"),
    "ọ̀" to listOf("Ọ̀", "Ọ̀"),
    "ọ̄" to listOf("Ọ̄", "Ọ̄"),
    "é" to listOf("É", "É"),
    "è" to listOf("È", "È"),
    "ē" to listOf("Ē", "Ē"),
    "ó" to listOf("Ó", "Ó"),
    "ò" to listOf("Ò", "Ò"),
    "ō" to listOf("Ō", "Ō"),
    "à" to listOf("À", "À"),
    "á" to listOf("Á", "Á"),
    "ā" to listOf("Ā", "Ā"),
    "ì" to listOf("Ì", "Ì"),
    "í" to listOf("Í", "Í"),
    "ī" to listOf("Ī", "Ī"),
    "ù" to listOf("Ù", "Ù"),
    "ú" to listOf("Ú", "Ú"),
    "ū" to listOf("Ū", "Ū"),
    "ń" to listOf("Ń", "Ń"),
    "ǹ" to listOf("Ǹ", "Ǹ"),
    "n̄" to listOf("N̄", "N̄"),
    "ḿ" to listOf("Ḿ", "Ḿ"),
    "m̀" to listOf("M̀", "M̀"),
    "m̄" to listOf("M̄", "M̄"),
    "i" to listOf("I", "I"),
    "u" to listOf("U", "U"),
    "ị́" to listOf("Ị́", "Ị́"),
    "ị̀" to listOf("Ị̀", "Ị̀"),
    "ị̄" to listOf("Ị̄", "Ị̄"),
    "ụ́" to listOf("Ụ́", "Ụ́"),
    "ụ̀" to listOf("Ụ̀", "Ụ̀"),
    "ụ̄" to listOf("Ụ̄", "Ụ̄"),
    "ṅ" to listOf("Ṅ", "Ṅ"),
    "ị" to listOf("Ị", "Ị"),
    "ọ" to listOf("Ọ", "Ọ"),
    "ụ" to listOf("Ụ", "Ụ"),
    "ñ" to listOf("Ñ", "Ñ"),
    "ɓ" to listOf("Ɓ", "Ɓ"),
    "ɗ" to listOf("Ɗ", "Ɗ"),
    "ƙ" to listOf("Ƙ", "Ƙ"),
    "gb" to listOf("Gb", "GB"),
    "nw" to listOf("Nw", "NW"),
    "ny" to listOf("Ny", "NY"),
    "ch" to listOf("Ch", "CH"),
    "gh" to listOf("Gh", "GH"),
    "gw" to listOf("Gw", "GW"),
    "kp" to listOf("Kp", "KP"),
    "kw" to listOf("Kw", "KW"),
    "sh" to listOf("Sh", "SH"),
    "ts" to listOf("Ts", "TS"),
  ) }

  fun alternateKeys(languageCode: String, key: String, shifted: Boolean = false, capsLocked: Boolean = false): List<String> {
    val canonicalLanguage = canonicalCode(languageCode)
    val canonicalKey = key.trim().lowercase()
    val variants = keyboardAlternatePopupsByCode[canonicalLanguage]?.get(canonicalKey).orEmpty()
    return if (shifted || capsLocked) variants.map { alternateCaseForms.getValue(it)[if (capsLocked) 1 else 0] } else variants
  }

  fun languageName(code: String): String =
    language(code)?.name
      ?: if (canonicalCode(code) == autoDetect.code) autoDetect.name else code

  private fun languagesFromCodes(codes: List<String>): List<TranslationLanguage> =
    codes.mapNotNull(::language).sortedBy { it.name.lowercase() }
}
