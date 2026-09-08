# پژوهش رابط و بانک دادهٔ Open eCalc

این سند نتیجهٔ بررسی نمونه‌های رابط موجود در `sample/imgs/1.png` تا
`sample/imgs/10.png`، آزمایش رفتاری eCalc و گزارش پژوهش قطعات است. هدف، ثبت
تصمیم‌های قابل اجراست؛ نه کپی‌کردن متن، برند یا بانک اختصاصی eCalc.

## DNA رابط نمونه‌ها

نمونه‌ها یک میزکار مهندسی فارسی را نشان می‌دهند: پس‌زمینهٔ آبی خیلی روشن،
سطح‌های سفید، گوشه‌های نرم، خط‌های کم‌رنگ و یک آبی عملیاتی برای اقدام اصلی.
در دسکتاپ، نوار کناری باریک برای جابه‌جایی، فرم مرحله‌ای در ستون اصلی و نتیجهٔ
چسبان در سمت دیگر دیده می‌شود. در موبایل، هر مرحله تمام‌عرض است، دکمهٔ ادامه
پایین صفحه می‌ماند و نتیجه در یک جریان مستقل با نوار پایین باز می‌شود.

الگوهای مهمی که باید حفظ شوند:

- کارت‌های بزرگ و خلوت برای بدنه، محیط، باتری و پیشران؛ هر کارت یک کار مشخص.
- نوار مرحله‌ای کوتاه با وضعیت فعال روشن؛ بدون تب‌های ریز یا اسکرول افقی.
- کنترل‌های عددی با واحد درون فیلد و اعداد لاتین برای خواندن دیتاشیت.
- نتیجهٔ تصویری: چهار شاخص اصلی، نمودار خطی زمان/برد، نمودار رانش/جریان،
  breakdown توان، هشدارها و تصویر پوشش روتورها.
- بانک قطعات به شکل جست‌وجو، فیلتر، تصویر، مشخصات و provenance؛ نه یک جدول
  شلوغ.
- صفحهٔ پروژه و تنظیمات از همان زبان بصری استفاده می‌کنند و قاب جعلی موبایل،
  شعار، آمار ساختگی و کارت تزئینی ندارند.

در طراحی جدید، فارسی زبان پیش‌فرض است و `Vazir.woff2` برای متن به‌کار می‌رود.
حالت روشن/تیره فقط با یک کنترل آیکونی تغییر می‌کند. عبارت‌های تبلیغاتی یا
کلیشه‌ای مانند «OPEN ECALC»، «Mission 01»، «Online»، «Service» و برچسب‌های
بی‌مصرف وارد پنل نمی‌شوند. تا وقتی ورودی کامل نشده، هیچ عدد پیش‌فرض یا نتیجه‌ای
نمایش داده نمی‌شود.

عنوان‌های کارت‌ها باید عملیاتی و کوتاه بمانند؛ از زیرعنوان‌های کلی مثل «جرم»،
«آرایش» و «هندسهٔ پایه» استفاده نمی‌شود. جزئیات علمی فقط کنار همان ورودی یا در
مستند محاسبات ثبت می‌شوند.

## رفتار بررسی‌شدهٔ eCalc

نسخهٔ عمومی `xcoptercalc.php` برای فهم جریان کار بررسی شد: انتخاب موتور، ملخ،
باتری و شرایط پرواز، سپس مشاهدهٔ نقاط کاری و نمودارها. این نسخهٔ قدیمی برای
الهام از دسته‌بندی ورودی و سناریوهای benchmark مفید است، اما ظاهر، متن، کد و
بانک قطعات آن وارد پروژه نمی‌شود. سناریوهای قابل تکرار در
`docs/benchmarks/` نگه‌داری می‌شوند.

## سیاست بانک داده

هیچ منبع واحدی معادل یک بانک کامل و آزاد eCalc پیدا نشد. راه درست، یک بانک
فدره‌شده با provenance اجباری، snapshot خام، hash پایدار، نرمال‌سازی SI و
دروازهٔ مجوز است. هر رکورد باید `sourceUrl`، `licenseSpdx`، `retrievedAt`,
`sourceHash` و `quality` داشته باشد؛ منحنی نیز محور، شرایط تست، نقاط مرتب، روش
درون‌یابی و خطای خارج از محدوده را ثبت می‌کند.

| منبع | کاربرد | وضعیت انتشار در بسته |
| --- | --- | --- |
| [StrawsonDesign/motor_propeller_testing](https://github.com/StrawsonDesign/motor_propeller_testing) | دادهٔ تست‌استند موتور/ملخ | کاندید MIT؛ پس از بررسی snapshot و attribution |
| [PyThrust](https://github.com/Setuav/PyThrust) | catalog و منحنی‌های موتور/ملخ | کاندید؛ مجوز هر رکورد upstream باید ممیزی شود |
| [UAV Database](https://uavdb.org/) | دادهٔ پرواز، airframe و تست ملخ | دانلود آزاد با ارجاع؛ در قرنطینه تا ممیزی assetها |
| [PropDBTools](https://github.com/ramcdona/PropDBTools) | parser فایل‌های UIUC DAT | BSD-2-Clause؛ ابزار قابل استفاده، اندازه‌گیری UIUC فعلاً bundle نیست |
| [UIUC Propeller Database](https://m-selig.ae.illinois.edu/props/propDB.html) | منحنی‌های آیرودینامیکی ملخ | منبع عمومی، اما حق بازتوزیع روشن نیست؛ import/quarantine |
| [LiionDB](https://github.com/ndrewwang/liiondb) | دادهٔ سلول و تخلیه | MIT؛ برای physics سلول، نه catalog پک تجاری |
| [Multicopter Battery and Range Calculations](https://github.com/tzi4/Multicopter_Battery_and_Range_Calculations) | اعتبارسنجی دوام و برد | MIT؛ مرجع مدل و تست، نه کپی calibration خصوصی |
| [PX4 airframes](https://github.com/PX4/PX4-Autopilot) | taxonomy آرایش‌های پروازی | BSD-3-Clause برای کد مرتبط؛ مشخصات محصولی از آن استخراج نمی‌شود |
| [OpenDroneList](https://github.com/dronetag/opendronelist) | نام مدل، جرم، جرم برخاست، زمان پرواز و کلاس | MIT؛ snapshot در `data/raw/opendronelist` و ۱۵۹ پروفایل در runtime |
| [Tyto Robotics](https://www.tytorobotics.com/pages/propeller-data) | benchmark تست‌استند | تا دریافت اجازه، bundle نمی‌شود |
| APC / T-Motor / KDE / SplineCloud | دیتاشیت و تصاویر رسمی | permission-required؛ فقط importer یا لینک منبع |

مجموعهٔ همراه فعلی فقط رکوردهای عمومی و پروژه‌نویس با برچسب `estimated` دارد.
منابعی که مجوز یا حق بازتوزیع آن‌ها مبهم است در `data/quarantine/` و manifest
ثبت می‌شوند، نه در خروجی وب/Tauri.

## پروفایل‌های پرنده و زمان پرواز

`static/data/aircraft.v1.json` از CSV اوپن‌دِرون‌لیست تولید می‌شود و ۱۵۹ مدل را
برای جست‌وجوی داخل برنامه دربرمی‌گیرد؛ از جمله خانواده‌های Mavic، Air، Phantom،
Matrice، eBee و Dragonfish. برای `Mavic 2 Pro` مقدار ۹۰۷ گرم و ۳۱ دقیقه و برای
`Mavic 3` مقدار ۸۹۵ گرم، ۴۶ دقیقه، برد ۳۰ کیلومتر و سقف سرویس ۶۰۰۰ متر از صفحات
رسمی DJI ثبت شده‌اند: [Mavic 2](https://www.dji.com/mavic-2/info) و
[Mavic 3](https://www.dji.com/support/product/mavic-3). این اعداد شرایط آزمون
بدون باد سازنده‌اند و با محاسبهٔ مأموریت جایگزین نمی‌شوند.

فهرست runtime فقط به مولتی‌روتور محدود نیست؛ مدل‌های fixed-wing نیز با فیلد
زمان پرواز قابل جست‌وجو هستند. تصویر گالری `aircraft-catalog-grid.png` یک تصویر
نمونهٔ عمومی چهارپنله است و به هیچ مدل یا سازنده‌ای نسبت داده نمی‌شود.

## طبقه‌بندی فایل‌ها و تصاویر

ساختار پیشنهادی برای جمع‌آوری agentها و importهای بعدی:

```text
data/
  raw/<source>/<snapshot>/       # فایل دست‌نخورده + hash
  quarantine/<source>/           # دادهٔ بدون مجوز قطعی یا دارای خطا
  normalized/{motors,props,escs,batteries,airframes,curves}/
  verified/                      # رکورد قابل استفاده در solver
  images/{motors,props,escs,batteries,airframes}/
  manifests/sources.v1.json
static/data/                     # bundle کوچک runtime
```

تصویر محصول فقط با مجوز روشن و attribution وارد `data/images` می‌شود. برای
رکوردهای فاقد تصویر از silhouette تولیدشدهٔ پروژه استفاده می‌کنیم؛ تصویر
سازنده بدون اجازه کپی نمی‌شود. نام فایل باید شامل شناسهٔ رکورد و hash باشد تا
duplicate و تغییر خاموش قابل تشخیص باشد.

## مسیر اعتبارسنجی

pipeline باید deterministic باشد: license gate ← snapshot ← SHA-256 ← parse
(CSV/JSON/DAT/SQLite/XLSX) ← نرمال‌سازی واحد ← بررسی بازهٔ فیزیکی و ترتیب منحنی
← deduplicate ← golden tests ← تولید manifest و bundle. مقادیر منفی، NaN، منحنی
کمتر از سه نقطه، محور نامرتب و رکورد بدون provenance رد می‌شوند. خارج‌شدن از
بازهٔ تست باید خطای `CURVE_OUT_OF_RANGE` بدهد و هرگز silently extrapolate نشود.

در رابط، badge کیفیت (`LAB`، `MFR`، `INDEPENDENT`، `DATASHEET`) کنار رکورد و
جزئیات منبع با یک کلیک نمایش داده می‌شود. «پوشش داده» از «عملکرد» جداست؛ تعداد
نقاط بیشتر به‌تنهایی به معنی دقت بیشتر نیست.

## منابع کامل‌تر

- گزارش پژوهش قطعات و دیتاست‌ها: `/home/shuriken/Downloads/deep-research-report (3).md` — نسخهٔ کاری دریافت‌شده از کاربر.
- [manifest منابع runtime](../static/data/source-manifest.json)
- [سیاست دادهٔ شخص ثالث](../THIRD_PARTY_DATA.md)
- [مدل محاسبات](calculation-model.md)
