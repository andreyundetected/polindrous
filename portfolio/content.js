/* All page text, one place per language, so nothing needs
   translating inline in index.html or script.js.
   Each work has a title (exact name) and specs (technique + size,
   left empty for digital works where no physical size applies). */
const CONTENT = {
  ru: {
    heroName: "Полина Павлова",
    heroLine: "Иллюстрация, постеры, рисунок - от акварели до компьютерной графики.",
    digitalTitle: "Диджитал",
    digitalDesc: "Афиши и обложки, собранные под конкретное событие.",
    watercolorTitle: "Акварель",
    watercolorDesc: "Книжные обложки и этюды, в которых цвет несёт сюжет.",
    pencilTitle: "Карандаш",
    pencilDesc: "Академический рисунок: фигура, портрет, натюрморт с вниманием к форме.",
    outroName: "Полина Павлова",
    outroLine: "Открыта к заказам на иллюстрацию, обложки и афиши.",
    alts: {
      gnezdo: { title: "Гнездо", specs: "Диджитал" },
      kurbatov: { title: "Курбатов", specs: "Диджитал" },
      kapustnikBw: { title: "Капустник", specs: "Диджитал - ч/б версия" },
      kapustnikGreen: { title: "Капустник", specs: "Диджитал - цветная версия" },
      tomatoes: { title: "Этюд \"Помидорный\"", specs: "акварель · 14,8 × 21 см" },
      fish: { title: "Этюд \"Рыбный\"", specs: "акварель · 14,8 × 21 см" },
      watercolorStillLife: { title: "Этюд с Ягермейстером", specs: "акварель · 29,7 × 42 см" },
      exitPoster: { title: "Постер для фестиваля Exit2", specs: "акрил · 29,7 × 42 см" },
      heartCover: { title: "Обложка для книги \"Собачье сердце\" М. Булгаков", specs: "акварель · 21 × 29,7 см" },
      metamorphosisCover: { title: "Обложка для книги \"Превращение\" Ф. Кафка", specs: "акварель, линер · 21 × 29,7 см" },
      matildaCover: { title: "Обложка для книги \"Матильда\" Р. Даль", specs: "акварель, линер · 21 × 29,7 см" },
      pencilStillLife: { title: "Натюрморт с гипсовыми фигурами", specs: "карандаш · 42 × 59,4 см" },
      torsoBack: { title: "Гипсовый бюст, сзади", specs: "карандаш · 42 × 59,4 см" },
      torsoFront: { title: "Гипсовый бюст, спереди", specs: "карандаш · 42 × 59,4 см" },
      figureStanding: { title: "Фигура мужчины, стоя", specs: "карандаш · 100 × 70 см" },
      figureSeated: { title: "Фигура мужчины на стуле", specs: "карандаш · 100 × 70 см" },
      houdon: { title: "Гипсовая голова Гудона", specs: "карандаш · 29,7 × 42 см" },
      apollo: { title: "Аполлон", specs: "карандаш · 29,7 × 42 см" }
    }
  },

  en: {
    heroName: "Polina Pavlova",
    heroLine: "Illustration, posters, drawing - from watercolor to computer graphics.",
    digitalTitle: "Digital",
    digitalDesc: "Posters and covers, each built around a specific event.",
    watercolorTitle: "Watercolor",
    watercolorDesc: "Book covers and studies where color carries the story.",
    pencilTitle: "Pencil",
    pencilDesc: "Academic drawing: figure, portrait, still life, close attention to form.",
    outroName: "Polina Pavlova",
    outroLine: "Open to commissions - illustration, covers, posters.",
    alts: {
      gnezdo: { title: "The Nest", specs: "Digital" },
      kurbatov: { title: "Kurbatov", specs: "Digital" },
      kapustnikBw: { title: "Kapustnik", specs: "Digital - black-and-white version" },
      kapustnikGreen: { title: "Kapustnik", specs: "Digital - color version" },
      tomatoes: { title: "Study \"Tomato\"", specs: "watercolor · 14.8 × 21 cm" },
      fish: { title: "Study \"Fish\"", specs: "watercolor · 14.8 × 21 cm" },
      watercolorStillLife: { title: "Study with Jägermeister", specs: "watercolor · 29.7 × 42 cm" },
      exitPoster: { title: "Poster for the Exit2 festival", specs: "acrylic · 29.7 × 42 cm" },
      heartCover: { title: "Cover for \"Heart of a Dog\" by M. Bulgakov", specs: "watercolor · 21 × 29.7 cm" },
      metamorphosisCover: { title: "Cover for \"The Metamorphosis\" by F. Kafka", specs: "watercolor, liner · 21 × 29.7 cm" },
      matildaCover: { title: "Cover for \"Matilda\" by R. Dahl", specs: "watercolor, liner · 21 × 29.7 cm" },
      pencilStillLife: { title: "Still life with plaster figures", specs: "pencil · 42 × 59.4 cm" },
      torsoBack: { title: "Plaster bust, back", specs: "pencil · 42 × 59.4 cm" },
      torsoFront: { title: "Plaster bust, front", specs: "pencil · 42 × 59.4 cm" },
      figureStanding: { title: "Standing male figure", specs: "pencil · 100 × 70 cm" },
      figureSeated: { title: "Man sitting on a chair", specs: "pencil · 100 × 70 cm" },
      houdon: { title: "Plaster head of Houdon", specs: "pencil · 29.7 × 42 cm" },
      apollo: { title: "Apollo", specs: "pencil · 29.7 × 42 cm" }
    }
  },

  sr: {
    heroName: "Polina Pavlova",
    heroLine: "Ilustracija, plakati, crtež - od akvarela do kompjuterske grafike.",
    digitalTitle: "Digitalno",
    digitalDesc: "Plakati i korice, napravljeni za konkretan događaj.",
    watercolorTitle: "Akvarel",
    watercolorDesc: "Korice knjiga i studije u kojima boja nosi priču.",
    pencilTitle: "Olovka",
    pencilDesc: "Akademski crtež: figura, portret, mrtva priroda, pažnja posvećena formi.",
    outroName: "Polina Pavlova",
    outroLine: "Otvorena za saradnju - ilustracija, korice, plakati.",
    alts: {
      gnezdo: { title: "Gnezdo", specs: "Digitalno" },
      kurbatov: { title: "Kurbatov", specs: "Digitalno" },
      kapustnikBw: { title: "Kapustnik", specs: "Digitalno - crno-bela verzija" },
      kapustnikGreen: { title: "Kapustnik", specs: "Digitalno - kolor verzija" },
      tomatoes: { title: "Studija \"Paradajz\"", specs: "akvarel · 14,8 × 21 cm" },
      fish: { title: "Studija \"Riba\"", specs: "akvarel · 14,8 × 21 cm" },
      watercolorStillLife: { title: "Studija sa Jägermeister-om", specs: "akvarel · 29,7 × 42 cm" },
      exitPoster: { title: "Plakat za festival Exit2", specs: "akril · 29,7 × 42 cm" },
      heartCover: { title: "Korica za \"Pseće srce\" M. Bulgakova", specs: "akvarel · 21 × 29,7 cm" },
      metamorphosisCover: { title: "Korica za \"Preobražaj\" F. Kafke", specs: "akvarel, flomaster · 21 × 29,7 cm" },
      matildaCover: { title: "Korica za \"Matildu\" R. Dala", specs: "akvarel, flomaster · 21 × 29,7 cm" },
      pencilStillLife: { title: "Mrtva priroda sa gipsanim figurama", specs: "olovka · 42 × 59,4 cm" },
      torsoBack: { title: "Gipsana bista, otpozadi", specs: "olovka · 42 × 59,4 cm" },
      torsoFront: { title: "Gipsana bista, spreda", specs: "olovka · 42 × 59,4 cm" },
      figureStanding: { title: "Muška figura, stojeći", specs: "olovka · 100 × 70 cm" },
      figureSeated: { title: "Muškarac na stolici", specs: "olovka · 100 × 70 cm" },
      houdon: { title: "Gipsana glava, Houdon", specs: "olovka · 29,7 × 42 cm" },
      apollo: { title: "Apolon", specs: "olovka · 29,7 × 42 cm" }
    }
  }
};