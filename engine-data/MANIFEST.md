# monkcli engine-data manifest

Source: /home/sid/Work/monkeytype

This bundle is hand-picked for implementing a CLI typing engine focused on:
- speed/wpm/raw calculations
- accuracy tracking
- random word generation
- language/quote loading and sample data

Core stats & timing:
- frontend/src/ts/test/test-stats.ts
- frontend/src/ts/test/test-input.ts
- frontend/src/ts/test/test-timer.ts
- frontend/src/ts/test/test-logic.ts

Word generation:
- frontend/src/ts/test/words-generator.ts
- frontend/src/ts/test/wordset.ts
- frontend/src/ts/test/test-words.ts
- frontend/src/ts/controllers/quotes-controller.ts

Supporting helpers:
- frontend/src/ts/utils/{arrays,misc,strings,json-data,generate,typing-speed-units,word-gen-error}.ts
- frontend/src/ts/input/helpers/validation.ts
- frontend/src/ts/test/{custom-text,practise-words,british-english,english-punctuation,lazy-mode,test-state}.ts
- frontend/src/ts/test/funbox/{list,funbox,funbox-functions}.ts
- frontend/src/ts/config.ts
- frontend/src/ts/observables/config-event.ts

Schema references:
- packages/schemas/src/{languages,configs,quotes}.ts

Sample datasets:
- frontend/static/languages/english.json
- frontend/static/languages/english_1k.json
- frontend/static/quotes/english.json
