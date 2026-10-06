"""
Django management command to seed canonical Faith module data.

Populates the database with:
- Morning & Evening Adhkar
- Situational Du'as (Sleep, Food, Travel, Distress, Mosque, Parents, Forgiveness)
- Prophetic Hadiths Library with authenticity grades and narrators
- Daily Good Deeds checklist

Usage:
    python manage.py seed_faith
    python backend/manage.py seed_faith
"""
from django.core.management.base import BaseCommand
from faith.models import Adhkar, Hadith, GoodDeed


# ═════════════════════════════════════════════════════════════════════════════
# STATIC DATA CATALOGS (Derived from frontend static audit)
# ═════════════════════════════════════════════════════════════════════════════

MORNING_ADHKAR = [
    {
        "arabic_text": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah...",
        "translation": "We have reached the morning and the entire kingdom belongs to Allah, and all praise is due to Allah. None has the right to be worshipped except Allah alone, without partner.",
        "target_count": 1,
        "source": "أبو داود",
        "category": "morning",
        "order": 1,
    },
    {
        "arabic_text": "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
        "transliteration": "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur.",
        "translation": "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and unto You is the resurrection.",
        "target_count": 1,
        "source": "أبو داود والترمذي",
        "category": "morning",
        "order": 2,
    },
    {
        "arabic_text": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        "transliteration": "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't...",
        "translation": "O Allah, You are my Lord! None has the right to be worshipped but You. You created me and I am Your slave, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done...",
        "target_count": 1,
        "source": "صحيح البخاري (سيد الاستغفار)",
        "category": "morning",
        "order": 3,
    },
    {
        "arabic_text": "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",
        "transliteration": "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa ant.",
        "translation": "O Allah, grant health to my body. O Allah, grant health to my hearing. O Allah, grant health to my sight. There is none worthy of worship except You.",
        "target_count": 3,
        "source": "أبو داود",
        "category": "morning",
        "order": 4,
    },
    {
        "arabic_text": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
        "transliteration": "Allahumma inni a'udhu bika minal-kufri wal-faqr, wa a'udhu bika min 'adhabil-qabr, la ilaha illa ant.",
        "translation": "O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the torment of the grave. None has the right to be worshipped except You.",
        "target_count": 3,
        "source": "أبو داود",
        "category": "morning",
        "order": 5,
    },
    {
        "arabic_text": "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        "transliteration": "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa huwas-Sami'ul-'Alim.",
        "translation": "In the name of Allah, with whose Name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
        "target_count": 3,
        "source": "أبو داود والترمذي",
        "category": "morning",
        "order": 6,
    },
    {
        "arabic_text": "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        "transliteration": "Radhitu billahi rabba, wa bil-islami dina, wa bi Muhammadin sallallahu 'alayhi wa sallama nabiyya.",
        "translation": "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings be upon him) as my Prophet.",
        "target_count": 3,
        "source": "أبو داود والترمذي",
        "category": "morning",
        "order": 7,
    },
    {
        "arabic_text": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        "transliteration": "Subhanallahi wa bihamdih.",
        "translation": "Glory be to Allah and all praise is due to Him.",
        "target_count": 100,
        "source": "صحيح مسلم",
        "category": "morning",
        "order": 8,
    },
    {
        "arabic_text": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        "transliteration": "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir.",
        "translation": "None has the right to be worshipped except Allah alone, without partner. To Him belongs all sovereignty and praise, and He is over all things capable.",
        "target_count": 10,
        "source": "صحيح مسلم",
        "category": "morning",
        "order": 9,
    },
    {
        "arabic_text": "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
        "transliteration": "Allahumma salli wa sallim 'ala nabiyyina Muhammad.",
        "translation": "O Allah, send Your blessings and peace upon our Prophet Muhammad.",
        "target_count": 10,
        "source": "متفق عليه",
        "category": "morning",
        "order": 10,
    },
]

EVENING_ADHKAR = [
    {
        "arabic_text": "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        "transliteration": "Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah.",
        "translation": "We have reached the evening and the entire kingdom belongs to Allah, and all praise is due to Allah. None has the right to be worshipped except Allah alone.",
        "target_count": 1,
        "source": "أبو داود",
        "category": "evening",
        "order": 1,
    },
    {
        "arabic_text": "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
        "transliteration": "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir.",
        "translation": "O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and unto You is our final return.",
        "target_count": 1,
        "source": "أبو داود",
        "category": "evening",
        "order": 2,
    },
    {
        "arabic_text": "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ",
        "transliteration": "Allahumma inni amsaytu ush-hiduka wa ush-hidu hamalata 'arshika wa mala'ikataka wa jami'a khalqika...",
        "translation": "O Allah, verily I enter this evening calling You to witness, and calling the bearers of Your Throne, Your angels and all of Your creation to witness that You are Allah, none has the right to be worshipped but You.",
        "target_count": 4,
        "source": "أبو داود",
        "category": "evening",
        "order": 3,
    },
    {
        "arabic_text": "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
        "transliteration": "Allahumma ma amsa bi min ni'matin aw bi'ahadin min khalqika faminka wahdaka la sharika lak...",
        "translation": "O Allah, whatever blessing has reached me or anyone of Your creation in this evening is from You alone, without partner. To You belongs praise and thanks.",
        "target_count": 1,
        "source": "أبو داود",
        "category": "evening",
        "order": 4,
    },
    {
        "arabic_text": "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
        "transliteration": "Hasbiyallahu la ilaha illa huwa, 'alayhi tawakkaltu wa huwa Rabbul-'Arshil-'Azim.",
        "translation": "Allah is sufficient for me. There is no god but He. I have relied upon Him and He is the Lord of the Mighty Throne.",
        "target_count": 7,
        "source": "أبو داود",
        "category": "evening",
        "order": 5,
    },
    {
        "arabic_text": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        "transliteration": "A'udhu bikalimatillahit-tammati min sharri ma khalaq.",
        "translation": "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        "target_count": 3,
        "source": "صحيح مسلم",
        "category": "evening",
        "order": 6,
    },
    {
        "arabic_text": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        "transliteration": "Subhanallahi wa bihamdih.",
        "translation": "Glory be to Allah and all praise is due to Him.",
        "target_count": 100,
        "source": "صحيح مسلم",
        "category": "evening",
        "order": 7,
    },
]

SITUATIONAL_DUAS = [
    # Sleep
    {
        "arabic_text": "اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا",
        "transliteration": "Allahumma bismika amutu wa ahya.",
        "translation": "O Allah, in Your name I die and I live.",
        "target_count": 1,
        "source": "صحيح البخاري",
        "category": "sleep",
        "order": 1,
    },
    {
        "arabic_text": "الحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        "transliteration": "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur.",
        "translation": "All praise is due to Allah who gave us life after having caused us to die, and unto Him is the resurrection.",
        "target_count": 1,
        "source": "صحيح البخاري",
        "category": "sleep",
        "order": 2,
    },
    # Food
    {
        "arabic_text": "بِسْمِ اللَّهِ",
        "transliteration": "Bismillah.",
        "translation": "In the name of Allah.",
        "target_count": 1,
        "source": "أبو داود",
        "category": "food",
        "order": 1,
    },
    {
        "arabic_text": "الحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
        "transliteration": "Alhamdu lillahil-ladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah.",
        "translation": "All praise is due to Allah who fed me this and provided it for me without any power or strength from myself.",
        "target_count": 1,
        "source": "أبو داود",
        "category": "food",
        "order": 2,
    },
    # Travel
    {
        "arabic_text": "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
        "transliteration": "Subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun.",
        "translation": "Glory be to Him who has subjected this for us, and we were not capable of it by ourselves. And indeed, unto our Lord we will return.",
        "target_count": 1,
        "source": "صحيح مسلم",
        "category": "travel",
        "order": 1,
    },
    # Distress
    {
        "arabic_text": "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
        "transliteration": "La ilaha illa anta subhanaka inni kuntu minaz-zalimin.",
        "translation": "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
        "target_count": 1,
        "source": "جامع الترمذي",
        "category": "distress",
        "order": 1,
    },
    {
        "arabic_text": "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
        "transliteration": "Hasbunallahu wa ni'mal-wakil.",
        "translation": "Allah is sufficient for us, and He is the best Disposer of affairs.",
        "target_count": 1,
        "source": "صحيح البخاري",
        "category": "distress",
        "order": 2,
    },
    # Mosque
    {
        "arabic_text": "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        "transliteration": "Allahummaftah li abwaba rahmatik.",
        "translation": "O Allah, open for me the doors of Your mercy.",
        "target_count": 1,
        "source": "صحيح مسلم",
        "category": "mosque",
        "order": 1,
    },
    # Parents
    {
        "arabic_text": "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
        "transliteration": "Rabbir-hamhuma kama rabbayani saghira.",
        "translation": "My Lord, have mercy upon them as they brought me up when I was small.",
        "target_count": 1,
        "source": "القرآن الكريم (الإسراء: ٢٤)",
        "category": "parents",
        "order": 1,
    },
    # Forgiveness
    {
        "arabic_text": "أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
        "transliteration": "Astaghfirullahal-ladhi la ilaha illa huwal-Hayyul-Qayyumu wa atubu ilayh.",
        "translation": "I seek the forgiveness of Allah, besides Whom there is no god, the Ever-Living, the Self-Subsisting, and I repent unto Him.",
        "target_count": 3,
        "source": "أبو داود والترمذي",
        "category": "forgiveness",
        "order": 1,
    },
]

HADITHS = [
    {
        "text": "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        "translation": "Actions are judged by motives and intentions, and every person will have only what they intended.",
        "narrator": "عمر بن الخطاب (رضي الله عنه)",
        "source": "متفق عليه (البخاري ومسلم)",
        "category": "إيمان",
        "grade": "sahih",
        "order": 1,
    },
    {
        "text": "الطَّهُورُ شَطْرُ الإِيمَانِ، وَالحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ",
        "translation": "Cleanliness and purity is half of faith, and saying 'Alhamdulillah' fills the scale.",
        "narrator": "أبو مالك الأشعري (رضي الله عنه)",
        "source": "صحيح مسلم",
        "category": "إيمان",
        "grade": "sahih",
        "order": 2,
    },
    {
        "text": "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
        "translation": "The best of people are those who are most beneficial to people.",
        "narrator": "جابر بن عبدالله (رضي الله عنه)",
        "source": "المعجم الأوسط للطبراني",
        "category": "أخلاق",
        "grade": "hasan",
        "order": 3,
    },
    {
        "text": "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
        "translation": "Whoever believes in Allah and the Last Day should speak good or remain silent.",
        "narrator": "أبو هريرة (رضي الله عنه)",
        "source": "متفق عليه (البخاري ومسلم)",
        "category": "أخلاق",
        "grade": "sahih",
        "order": 4,
    },
    {
        "text": "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ، وَفِي كُلٍّ خَيْرٌ",
        "translation": "The strong believer is better and more beloved to Allah than the weak believer, though there is good in both.",
        "narrator": "أبو هريرة (رضي الله عنه)",
        "source": "صحيح مسلم",
        "category": "إيمان",
        "grade": "sahih",
        "order": 5,
    },
    {
        "text": "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        "translation": "None of you truly believes until he loves for his brother what he loves for himself.",
        "narrator": "أنس بن مالك (رضي الله عنه)",
        "source": "متفق عليه (البخاري ومسلم)",
        "category": "إيمان",
        "grade": "sahih",
        "order": 6,
    },
    {
        "text": "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
        "translation": "Whoever follows a path in pursuit of knowledge, Allah will make easy for him a path to Paradise.",
        "narrator": "أبو هريرة (رضي الله عنه)",
        "source": "صحيح مسلم",
        "category": "علم",
        "grade": "sahih",
        "order": 7,
    },
    {
        "text": "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
        "translation": "Be conscious of Allah wherever you are, follow an evil deed with a good one to erase it, and treat people with good character.",
        "narrator": "أبو ذر ومعاذ بن جبل (رضي الله عنهما)",
        "source": "جامع الترمذي",
        "category": "تقوى",
        "grade": "hasan_sahih",
        "order": 8,
    },
    {
        "text": "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
        "translation": "The acts most pleasing to Allah are those which are done continuously, even if they are small.",
        "narrator": "عائشة (رضي الله عنها)",
        "source": "متفق عليه (البخاري ومسلم)",
        "category": "عبادة",
        "grade": "sahih",
        "order": 9,
    },
    {
        "text": "الدِّينُ النَّصِيحَةُ",
        "translation": "Religion is sincerity and good counsel.",
        "narrator": "تميم الداري (رضي الله عنه)",
        "source": "صحيح مسلم",
        "category": "دين",
        "grade": "sahih",
        "order": 10,
    },
    {
        "text": "كُلُّ مَعْرُوفٍ صَدَقَةٌ",
        "translation": "Every good deed is charity.",
        "narrator": "جابر بن عبدالله (رضي الله عنه)",
        "source": "متفق عليه",
        "category": "صدقة",
        "grade": "sahih",
        "order": 11,
    },
    {
        "text": "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ",
        "translation": "Your smiling in the face of your brother is charity for you.",
        "narrator": "أبو ذر (رضي الله عنه)",
        "source": "جامع الترمذي",
        "category": "صدقة",
        "grade": "sahih",
        "order": 12,
    },
    {
        "text": "مَنْ لَا يَرْحَمْ لَا يُرْحَمْ",
        "translation": "He who does not show mercy will not be shown mercy.",
        "narrator": "أبو هريرة (رضي الله عنه)",
        "source": "متفق عليه (البخاري ومسلم)",
        "category": "رحمة",
        "grade": "sahih",
        "order": 13,
    },
]

GOOD_DEEDS = [
    {
        "title": "صيام",
        "title_en": "Fasting",
        "description": "Voluntary fasting (e.g. Mondays, Thursdays, or White Days) shields against the fire and elevates spiritual awareness.",
        "emoji": "🌙",
        "is_recommended_excuse": False,
        "order": 1,
    },
    {
        "title": "صدقة",
        "title_en": "Sadaqah",
        "description": "Charity extinguishes sins as water extinguishes fire — and wealth is never decreased by charity.",
        "emoji": "💰",
        "is_recommended_excuse": True,
        "order": 2,
    },
    {
        "title": "قراءة القرآن",
        "title_en": "Read Quran",
        "description": "Whoever recites a single letter from the Book of Allah receives ten rewards for each letter.",
        "emoji": "📖",
        "is_recommended_excuse": True,
        "order": 3,
    },
    {
        "title": "قيام الليل",
        "title_en": "Night Prayer",
        "description": "The best voluntary prayer after the obligatory prayers is Tahajjud in the depths of the night.",
        "emoji": "🌟",
        "is_recommended_excuse": False,
        "order": 4,
    },
    {
        "title": "عيادة مريض",
        "title_en": "Visit the Sick",
        "description": "Visiting the sick brings comfort to believers and immerses the visitor in divine mercy.",
        "emoji": "🤲",
        "is_recommended_excuse": True,
        "order": 5,
    },
    {
        "title": "مساعدة غيره",
        "title_en": "Help Others",
        "description": "Allah remains in the aid of His servant as long as the servant is in the aid of his fellow brother.",
        "emoji": "🫂",
        "is_recommended_excuse": True,
        "order": 6,
    },
    {
        "title": "دعاء",
        "title_en": "Make Du'a",
        "description": "Supplication is the essence of worship and the most intimate connection with the Creator.",
        "emoji": "🙏",
        "is_recommended_excuse": True,
        "order": 7,
    },
    {
        "title": "صلة الرحم",
        "title_en": "Family Ties",
        "description": "Maintaining ties of kinship expands provision, brings blessings, and prolongs lifespan.",
        "emoji": "❤️",
        "is_recommended_excuse": True,
        "order": 8,
    },
]


# ═════════════════════════════════════════════════════════════════════════════
# MANAGEMENT COMMAND
# ═════════════════════════════════════════════════════════════════════════════

class Command(BaseCommand):
    help = "Seeds database with canonical Adhkar, Hadiths, and Good Deeds catalogs."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Starting Faith module database seed..."))

        # 1. Seed Adhkar & Du'as
        all_adhkar = MORNING_ADHKAR + EVENING_ADHKAR + SITUATIONAL_DUAS
        adhkar_created = 0
        adhkar_existing = 0

        for item in all_adhkar:
            _, created = Adhkar.objects.get_or_create(
                arabic_text=item["arabic_text"],
                category=item["category"],
                defaults={
                    "transliteration": item.get("transliteration", ""),
                    "translation": item.get("translation", ""),
                    "target_count": item.get("target_count", 1),
                    "source": item.get("source", ""),
                    "order": item.get("order", 0),
                },
            )
            if created:
                adhkar_created += 1
            else:
                adhkar_existing += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Adhkar & Du'as: {adhkar_created} created, {adhkar_existing} already up to date."
            )
        )

        # 2. Seed Hadiths
        hadith_created = 0
        hadith_existing = 0

        for item in HADITHS:
            _, created = Hadith.objects.get_or_create(
                text=item["text"],
                source=item["source"],
                defaults={
                    "translation": item.get("translation", ""),
                    "narrator": item.get("narrator", ""),
                    "category": item.get("category", "عام"),
                    "grade": item.get("grade", "sahih"),
                    "order": item.get("order", 0),
                },
            )
            if created:
                hadith_created += 1
            else:
                hadith_existing += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Hadiths: {hadith_created} created, {hadith_existing} already up to date."
            )
        )

        # 3. Seed Good Deeds
        deeds_created = 0
        deeds_existing = 0

        for item in GOOD_DEEDS:
            _, created = GoodDeed.objects.get_or_create(
                title_en=item["title_en"],
                defaults={
                    "title": item["title"],
                    "description": item.get("description", ""),
                    "emoji": item.get("emoji", "🤲"),
                    "is_recommended_excuse": item.get("is_recommended_excuse", False),
                    "order": item.get("order", 0),
                },
            )
            if created:
                deeds_created += 1
            else:
                deeds_existing += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Good Deeds: {deeds_created} created, {deeds_existing} already up to date."
            )
        )

        total_seeded = adhkar_created + hadith_created + deeds_created
        self.stdout.write(
            self.style.SUCCESS(
                f"\nFaith data seeding completed successfully! ({total_seeded} records added)"
            )
        )
