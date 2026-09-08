# منابع دادهٔ قطعات

این پروژه فقط داده‌ای را داخل بسته قرار می‌دهد که مجوز بازتوزیع آن روشن باشد.
کد برنامه MIT است؛ مجوز هر رکورد در خود رکورد و در `source-manifest.json` نگه‌داری
می‌شود.

## وضعیت فعلی

`components.v1.json` یک مجموعهٔ کوچک CC0 است که برای تست رابط و کالیبراسیون
محاسبات نوشته شده است. سازندهٔ آن `Open eCalc` است و نباید به‌عنوان دیتاشیت
تولیدکننده یا اندازه‌گیری آزمایشگاهی تعبیر شود. برای جلوگیری از نسبت‌دادن نادرست،
رکوردها برچسب `estimated` دارند.

سه منبع GitHub برای توسعهٔ importer و اعتبارسنجی ثبت شده‌اند، اما دادهٔ خام آن‌ها
فعلاً bundle نشده است:

| منبع | مجوز | استفادهٔ مجاز در این پروژه | وضعیت |
| --- | --- | --- | --- |
| [Multicopter Battery and Range Calculations](https://github.com/tzi4/Multicopter_Battery_and_Range_Calculations/tree/bdc1ce02f48b570cd13c0788a80a3ddaeb263fc0) | MIT | مقایسهٔ مدل دوام و range؛ استخراج داده فقط با attribution | مرجع اعتبارسنجی |
| [PropDBTools](https://github.com/ramcdona/PropDBTools/tree/4fa41c8c9e07369474768567e968f1b16c453f48) | BSD-2-Clause | الگوی parser برای DAT و test-stand | مرجع ابزار |
| [LiionDB](https://github.com/ndrewwang/liiondb) | MIT | کاندیدای دادهٔ باتری پس از نرمال‌سازی provenance | در صف بررسی |

## سیاست بازتوزیع

داده‌های UIUC Propeller Database عمومی قابل دانلود هستند، اما صفحهٔ منبع مجوز
بازتوزیع bundle را تضمین نمی‌کند؛ بنابراین در این نسخه وارد نشده‌اند. داده‌های
eCalc، Tyto، APC و SplineCloud نیز به‌دلیل نبود مجوز روشن وارد نمی‌شوند.

هر importer باید برای هر رکورد `sourceUrl`، `licenseSpdx`، `retrievedAt`،
`sourceHash` و `quality` بسازد. فایل‌های خام بزرگ یا باینری فقط به‌صورت مسیر و
hash در manifest ثبت می‌شوند و بدون بررسی مجوز داخل خروجی وب/دسکتاپ کپی نمی‌شوند.
