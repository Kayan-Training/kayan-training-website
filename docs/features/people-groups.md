# People groups in programs and events

## Editing

1. Open **Dashboard → People** to create or update reusable profiles. The existing `/en/dashboard/trainers` URL remains valid.
2. Open a program/event and select **People groups**.
3. Add a group. Use the editor’s English/Arabic switcher to name it in each language. At least one name is required; the website falls back to the other language when a translation is missing.
4. Select **Add people** and search the directory by English/Arabic name or title. Add several profiles without reopening the picker; existing members are marked and cannot be added twice. The same profile can belong to several groups, but only once inside each group.
5. Drag a group by its handle to reorder sections. Drag a person to reorder members or move them to another group, including an empty group. Each person’s action menu provides up/down ordering, moves to another group, and removal. **Add to group** creates another membership while keeping the person in the current group; destinations where they already belong are disabled. **Move to group** removes the current membership and keeps other memberships intact. Group action menus provide ordering and removal. Drag handles also support Space, arrow keys, Space to drop, and Escape to cancel.
6. Use a group heading to collapse or expand it. The header keeps the member count visible. Collapsed groups accept dragged people; newly created groups open and focus their name field. The first group starts expanded and the others collapsed.
7. Save the program/event. Public event and training-course pages show populated groups in the saved order, with the names and profiles localized to the current page language.

Moving someone into a group where they already belong removes the source membership and keeps one target membership. Other memberships remain unchanged. Removing a person from a group keeps their profile and other memberships. Removing a populated group requires confirmation. Empty groups are retained in the editor and hidden on public pages.

**Hero People Label** controls the people-count label in the featured hero. Each group controls its own public section heading.

The dropdown scroll-arrow surfaces use the same white background and visible icon color as their option list. This prevents the public dark theme from leaking into dashboard dropdown portals. The people picker and action menus explicitly retain the dashboard theme. The picker exposes a scrollbar and a scroll hint when results overflow; wheel scrolling is contained inside it. Row positions remain stable during an open session, including after additions. Pointer hover uses CSS feedback without updating command selection during scrolling; keyboard navigation remains available. Thumbnails reserve their dimensions and decode asynchronously, with deferred loading.

## Existing content and storage

No database migration or bulk backfill is needed. Older programs/events without group metadata are read as one **Trainers / المدربون** group. Any existing custom people heading and member order are retained. Their first save writes the groups explicitly. An explicitly empty list never falls back to the old assignments.

Ordered groups are stored in `bankTransferDetails.peopleGroups` as `{ version: 1, groups: [{ id, nameEn, nameAr, memberIds }] }`, following the repository’s existing display-metadata convention. Each program/event owns its own groups. The unique union of member IDs remains in `EventTrainer`, preserving the existing profile and agenda model. Updates validate groups on the server and save the metadata and relations in a single transaction; creation uses a single nested Prisma create. Public reads filter out deleted profiles. Profile updates invalidate both localized detail routes.

## Verification

- Unit coverage: legacy/default/custom headings and order, localization fallback, empty lists, stale IDs, group and membership uniqueness, reorder/move semantics, and public grouping.
- Server-action coverage with a mocked database: authorization, validation before writes, unique member union, explicit clearing, nested creation, transaction boundaries, and failed-save handling.
- Commands: `pnpm test:unit`, `pnpm test:event-form`, `pnpm typecheck`, and scoped Biome lint.
- Rendered local fixtures: full EventForm submission and invalid-name recovery; mouse, keyboard and mobile touch dragging; duplicate-target moves; removal confirmation; saved group/member order; Arabic names; desktop, 390px and 320px bounds. Review images are in `output/people-groups/` (local, ignored by Git).
- Drag-preview regression: people and group previews remain centered on the pointer inside transformed, scrolled editor panels in LTR/RTL. The preview renders through a body portal, retains the dashboard theme, and leaves keyboard reordering intact.
- Browser checks use the real editor and public renderer with fixture data. No production database writes or deployment were performed.

## دليل مختصر

افتح **الأشخاص** في لوحة التحكم لإدارة الملفات الشخصية المشتركة، ثم افتح البرنامج أو الفعالية واختر **مجموعات الأشخاص**. أضف مجموعة وسمّها بالعربية والإنجليزية باستخدام مبدّل اللغة، ثم اختر أعضاءها من الدليل.

اسحب المجموعات لترتيب أقسامها، واسحب الأشخاص لترتيبهم أو نقلهم بين المجموعات. تتوفر أيضًا أزرار الرفع والخفض وقائمة النقل. يمكن للشخص الظهور في عدة مجموعات، دون تكراره داخل المجموعة نفسها. احفظ البرنامج أو الفعالية لتظهر التغييرات في الموقع.

المجموعات مستقلة لكل برنامج أو فعالية. حذف العضوية لا يحذف الملف الشخصي أو عضويات الشخص الأخرى. المجموعات الفارغة لا تظهر في الموقع. تُحفظ إسنادات المدربين القديمة وعناوينها وترتيبها تلقائيًا في مجموعة أولية، دون الحاجة إلى ترحيل قاعدة البيانات.


يمكنك طي المجموعة أو توسيعها من عنوانها، مع بقاء عدد أعضائها ظاهرًا وإمكانية نقل الأشخاص إليها بالسحب وهي مطوية. ابحث في «إضافة أشخاص» بالاسم أو التخصص، وأضف عدة أشخاص دون إعادة فتح القائمة. استخدم قائمة خيارات الشخص للترتيب والنقل والإزالة، وقائمة المجموعة لترتيبها أو حذفها.

إجراء «إضافة إلى مجموعة» يضيف عضوية جديدة مع إبقاء الشخص في مجموعته الحالية، ويمنع تكراره داخل المجموعة المستهدفة. إجراء «نقل إلى مجموعة» يزيل العضوية الحالية فقط. تعرض قائمة الأشخاص شريط تمرير وإشارة للتمرير عند وجود نتائج إضافية، وتبقى الصفوف في مواضعها عند إضافة الأشخاص.


## Collapse motion and photo performance

Group bodies animate grid-row height and opacity over 250ms, reverse smoothly when interrupted, and skip transitions for reduced-motion preferences. Collapsed contents are inert and hidden from assistive technology. The editor reserves scrollbar space so its width and horizontal position remain stable when groups change height. Drag geometry is measured during dragging rather than continuously while idle.

Dashboard member rows and picker entries share `PersonAvatar`, which uses the existing Next image optimizer and configured image hosts to request appropriately sized cached thumbnails at quality 72. Fixed avatar dimensions and initials prevent layout shifts while a thumbnail loads or if a request fails. Full-resolution uploads are not decoded by the browser for these small avatars.

Measured locally using the actual 27-profile directory (read-only): source photos reached 11,801px wide and the original picker produced browser long tasks up to 426ms. Blocking images removed the long tasks. With optimized thumbnails, the same scrolling test produced no long tasks; visible picker images decoded at 32px at DPR 1. The collapse reproduction moved the editor 7.5px horizontally before the scrollbar reservation and 0px after. These are local browser measurements, not production-wide performance guarantees.

تتمدد المجموعات وتُطوى بحركة ارتفاع وتلاشي مدتها 250 مللي ثانية، مع احترام إعداد تقليل الحركة. تُحجز مساحة شريط التمرير لمنع تغيّر موضع المحرر عند الطي. تُعرض الصور الشخصية كمصغرات محسّنة بدل فك ترميز الصور الأصلية الكبيرة، وتظهر الأحرف الأولى أثناء التحميل أو عند تعذّره.
