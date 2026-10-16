import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

SRC_PPTX = "/Users/gourav/.gemini/antigravity/brain/e81ff742-7fb0-49e4-ad05-2bcf854e9d95/.user_uploaded/media_1791626834497_ef6462cf.pptx"
OUT_PPTX = "/Users/gourav/NexCart/NexCart_Project_Presentation.pptx"

def set_text_run(paragraph, text, font_name="Calibri", font_size_pt=11.0, bold=False, color_rgb=None, align=None):
    paragraph.text = ""
    run = paragraph.add_run()
    run.text = text
    if font_name:
        run.font.name = font_name
    if font_size_pt:
        run.font.size = Pt(font_size_pt)
    run.font.bold = bold
    if color_rgb:
        run.font.color.rgb = color_rgb
    if align:
        paragraph.alignment = align
    return run

def create_presentation():
    prs = pptx.Presentation(SRC_PPTX)
    print(f"Loaded source template with {len(prs.slides)} slides.")

    # Colors
    WHITE = RGBColor(0xFF, 0xFF, 0xFF)
    SLATE_100 = RGBColor(0xF1, 0xF5, 0xF9)
    SLATE_200 = RGBColor(0xE2, 0xE8, 0xF0)
    SLATE_300 = RGBColor(0xCB, 0xD5, 0xE1)
    SLATE_400 = RGBColor(0x94, 0xA3, 0xB8)
    SLATE_800 = RGBColor(0x1E, 0x29, 0x3B)
    SLATE_900 = RGBColor(0x0F, 0x17, 0x2A)
    INDIGO = RGBColor(0x63, 0x66, 0xF1)
    INDIGO_LIGHT = RGBColor(0x81, 0x8C, 0xF8)
    EMERALD = RGBColor(0x10, 0xB9, 0x81)
    EMERALD_LIGHT = RGBColor(0x34, 0xD3, 0x99)
    SKY = RGBColor(0x38, 0xBD, 0xF8)
    AMBER = RGBColor(0xF5, 0x9E, 0x0B)

    # ----------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # ----------------------------------------------------
    s1 = prs.slides[0]
    for shp in s1.shapes:
        if shp.name == "Text 3":
            # Cambria title & subtitle
            tf = shp.text_frame
            tf.word_wrap = True
            # Paragraphs:
            # 0: ""
            # 1: ""
            # 2: "AI POWERED SMART SOLUTIONS"
            # 3: Subtitle
            while len(tf.paragraphs) < 4:
                tf.add_paragraph()
            p2 = tf.paragraphs[2]
            p2.text = "AI POWERED SMART SOLUTIONS"
            if len(p2.runs) > 0:
                p2.runs[0].font.name = "Cambria"
                p2.runs[0].font.size = Pt(38.0)
                p2.runs[0].font.color.rgb = WHITE
                p2.runs[0].font.bold = True
            
            p3 = tf.paragraphs[3]
            p3.text = "Intelligent Supermarket Automation System"
            if len(p3.runs) > 0:
                p3.runs[0].font.name = "Cambria"
                p3.runs[0].font.size = Pt(26.0)
                p3.runs[0].font.color.rgb = EMERALD_LIGHT
                p3.runs[0].font.bold = False

        elif shp.name == "Text 7":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "Project", font_name="Calibri", font_size_pt=14.0, bold=True, color_rgb=EMERALD_LIGHT, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 8":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "NexCart", font_name="Calibri", font_size_pt=20.0, bold=True, color_rgb=WHITE, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 9":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "MERN Stack • POS & FEFO Inventory", font_name="Calibri", font_size_pt=11.0, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)

        elif shp.name == "Shape 7":
            # Presenter details already match Gourav Dutta, Regd: 2301020762
            # Let's ensure formatting is crisp and bright white
            tf = shp.text_frame
            lines = [
                ("PRESENTED BY: ", "GOURAV DUTTA"),
                ("REGD.NO: ", "2301020762"),
                ("BRANCH: ", "CSE(WEB TECHNOLOGY)"),
                ("UNIVERSITY: ", "C.V.RAMAN GLOBAL UNIVERSITY,BHUBANESWAR"),
                ("SUBMITTED TO: ", "INDUSTRIAL INTERNSHIP TRAINING")
            ]
            for idx, (label, val) in enumerate(lines):
                if idx < len(tf.paragraphs):
                    p = tf.paragraphs[idx]
                    p.text = ""
                    r1 = p.add_run()
                    r1.text = label
                    r1.font.name = "Calibri"
                    r1.font.size = Pt(13.0)
                    r1.font.bold = True
                    r1.font.color.rgb = SLATE_300

                    r2 = p.add_run()
                    r2.text = val
                    r2.font.name = "Calibri"
                    r2.font.size = Pt(13.0)
                    r2.font.bold = True
                    r2.font.color.rgb = WHITE

    print("Slide 1 updated.")

    # ----------------------------------------------------
    # SLIDE 2: TECH STACK & SYSTEM HIGHLIGHTS
    # ----------------------------------------------------
    s2 = prs.slides[1]
    for shp in s2.shapes:
        if shp.name == "Text 4":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "NexCart", font_name="Calibri", font_size_pt=28.0, bold=True, color_rgb=WHITE)

        elif shp.name == "Text 5":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "Intelligent Supermarket Automation", font_name="Calibri", font_size_pt=12.0, bold=False, color_rgb=SLATE_200)

        elif shp.name == "Text 7":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "React 18 / Vite", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 9":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "Node / Express", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 11":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "MongoDB 7", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 13":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "Tailwind CSS", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 15":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "Socket.io", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

        elif shp.name == "Text 17":
            tf = shp.text_frame
            p = tf.paragraphs[0]
            set_text_run(p, "PDFKit / JWT", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

    # Add 3 feature cards on right side of Slide 2 (left = 4.15 to 9.60)
    cards_data = [
        ("⚡ Dual-Engine POS & Self-Checkout", 
         "Express cashier POS terminal with cart hold & recall, combined with direct customer self-checkout via camera and barcode scanner.", 
         EMERALD_LIGHT, 1.35),
        ("📦 FEFO Automated Depletion & Expiry Radar", 
         "Nearest-expiry-first inventory depletion preventing spoiled stock sales, paired with a 30-day proactive expiry radar and stock alerts.", 
         INDIGO_LIGHT, 2.65),
        ("🛡️ ACID Multi-Doc Transactions & GST Compliance", 
         "MongoDB replica set transactions preventing overselling races, with automated CGST/SGST calculation and authenticated PDF receipts in INR (₹).", 
         SKY, 3.95),
    ]

    # Header badge on right
    hdr_box = s2.shapes.add_textbox(Inches(4.15), Inches(0.40), Inches(5.45), Inches(0.80))
    tf = hdr_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    set_text_run(p1, "SYSTEM CAPABILITIES & ARCHITECTURE OVERVIEW", font_name="Calibri", font_size_pt=9.5, bold=True, color_rgb=INDIGO_LIGHT)
    p2 = tf.add_paragraph()
    set_text_run(p2, "Engineered for Enterprise Retail Performance", font_name="Calibri", font_size_pt=18.0, bold=True, color_rgb=WHITE)

    for title, desc, title_col, top_in in cards_data:
        # Background card
        card_shp = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.15), Inches(top_in), Inches(5.45), Inches(1.15))
        card_shp.fill.solid()
        card_shp.fill.fore_color.rgb = SLATE_800
        card_shp.line.color.rgb = RGBColor(0x33, 0x41, 0x55)
        card_shp.line.width = Pt(1.0)
        
        # Text box inside
        tb = s2.shapes.add_textbox(Inches(4.30), Inches(top_in + 0.10), Inches(5.15), Inches(0.95))
        tf = tb.text_frame
        tf.word_wrap = True
        pt = tf.paragraphs[0]
        set_text_run(pt, title, font_name="Calibri", font_size_pt=12.0, bold=True, color_rgb=title_col)
        pd = tf.add_paragraph()
        pd.space_before = Pt(4)
        set_text_run(pd, desc, font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)

    print("Slide 2 updated with right-hand highlight cards.")

    # ----------------------------------------------------
    # SLIDE 3: INTERNSHIP CERTIFICATE
    # ----------------------------------------------------
    # Picture 4 is already the high-res OCAC Certificate image! Kept intact.
    print("Slide 3 preserved (OCAC Certificate).")

    # ----------------------------------------------------
    # SLIDE 4: INTRODUCTION
    # ----------------------------------------------------
    s4 = prs.slides[3]
    for shp in s4.shapes:
        if shp.name == "Text 2":
            set_text_run(shp.text_frame.paragraphs[0], "What is NexCart?", font_name="Calibri", font_size_pt=26.0, bold=True, color_rgb=WHITE)
        elif shp.name == "Text 5":
            set_text_run(shp.text_frame.paragraphs[0], "What is it?", font_name="Calibri", font_size_pt=12.0, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 6":
            set_text_run(shp.text_frame.paragraphs[0], 
                         "An enterprise-grade, full-stack intelligent supermarket automation platform unifying express self-checkout, cashier POS, automated FEFO inventory depletion, and secure audit trails.", 
                         font_name="Calibri", font_size_pt=11.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 8":
            set_text_run(shp.text_frame.paragraphs[0], "How does it work?", font_name="Calibri", font_size_pt=12.0, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 9":
            set_text_run(shp.text_frame.paragraphs[0], 
                         "Customers and cashiers scan barcodes or SKUs; transactions execute with MongoDB replica set ACID guarantees; stock decrements strictly by Nearest Expiry First (FEFO); invoices generate with GST breakdowns.", 
                         font_name="Calibri", font_size_pt=11.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 11":
            set_text_run(shp.text_frame.paragraphs[0], "Why Automation?", font_name="Calibri", font_size_pt=12.0, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 12":
            set_text_run(shp.text_frame.paragraphs[0], 
                         "Eliminates manual queue bottlenecks, prevents expired inventory sales, stops revenue shrinkage from billing oversights, and provides real-time multi-tier supermarket governance.", 
                         font_name="Calibri", font_size_pt=11.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 14":
            set_text_run(shp.text_frame.paragraphs[0], "Who benefits?", font_name="Calibri", font_size_pt=12.0, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 15":
            set_text_run(shp.text_frame.paragraphs[0], 
                         "Shoppers (instant self-checkout), Cashiers (streamlined POS terminal with hold/recall), Inventory Managers (batch receiving & expiry alerts), and Admins (live revenue analytics & audit trails).", 
                         font_name="Calibri", font_size_pt=11.0, bold=False, color_rgb=SLATE_200)
    print("Slide 4 updated (Introduction).")

    # ----------------------------------------------------
    # SLIDE 5: PROBLEM STATEMENT
    # ----------------------------------------------------
    s5 = prs.slides[4]
    for shp in s5.shapes:
        if shp.name == "Text 2":
            set_text_run(shp.text_frame.paragraphs[0], "Current Pain Points in Supermarkets", font_name="Calibri", font_size_pt=26.0, bold=True, color_rgb=WHITE)
        elif shp.name == "Text 6":
            set_text_run(shp.text_frame.paragraphs[0], "Long manual checkout queues causing 30–40% customer cart abandonment", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 8":
            set_text_run(shp.text_frame.paragraphs[0], "Substantial revenue losses from spoiled goods due to lack of FEFO batch tracking", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 10":
            set_text_run(shp.text_frame.paragraphs[0], "Phantom inventory & stock discrepancies between shelves, warehouses, and POS", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 12":
            set_text_run(shp.text_frame.paragraphs[0], "Vulnerability to race conditions and inventory overselling during rush hours", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 14":
            set_text_run(shp.text_frame.paragraphs[0], "Fragmented compliance with Indian retail tax standards (GST & HSN invoicing)", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 16":
            set_text_run(shp.text_frame.paragraphs[0], "40%", font_name="Calibri", font_size_pt=30.0, bold=True, color_rgb=INDIGO_LIGHT, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 17":
            set_text_run(shp.text_frame.paragraphs[0], "Peak Hour Queue Delays", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 19":
            set_text_run(shp.text_frame.paragraphs[0], "12–15%", font_name="Calibri", font_size_pt=30.0, bold=True, color_rgb=AMBER, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 20":
            set_text_run(shp.text_frame.paragraphs[0], "FMCG Margins Lost to Expiry", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 22":
            set_text_run(shp.text_frame.paragraphs[0], "0%", font_name="Calibri", font_size_pt=30.0, bold=True, color_rgb=SKY, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 23":
            set_text_run(shp.text_frame.paragraphs[0], "Real-Time Stock Discrepancy", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)
    print("Slide 5 updated (Problem Statement).")

    # ----------------------------------------------------
    # SLIDE 6: OBJECTIVES
    # ----------------------------------------------------
    s6 = prs.slides[5]
    for shp in s6.shapes:
        if shp.name == "Text 2":
            set_text_run(shp.text_frame.paragraphs[0], "What This Project Aims to Achieve", font_name="Calibri", font_size_pt=26.0, bold=True, color_rgb=WHITE)
        elif shp.name == "Text 7":
            set_text_run(shp.text_frame.paragraphs[0], "Dual-Engine POS & Self-Checkout: Provide instant barcode scanning, cart management, and rapid bill generation.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 11":
            set_text_run(shp.text_frame.paragraphs[0], "FEFO Batch Inventory Management: Automatically deplete batches nearing expiration first to minimize grocery shrinkage.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 15":
            set_text_run(shp.text_frame.paragraphs[0], "ACID Transactional Consistency: Guarantee zero overselling and atomic rollback across inventory, coupons, and orders.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 19":
            set_text_run(shp.text_frame.paragraphs[0], "Predictive 30-Day Expiry Radar: Automatically categorize goods into Safe, Warning, and Critical batches.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 23":
            set_text_run(shp.text_frame.paragraphs[0], "Indian Market GST & Invoicing: Auto-calculate CGST, SGST, IGST, and deliver authenticated thermal receipts & downloadable PDFs.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 27":
            set_text_run(shp.text_frame.paragraphs[0], "Enterprise RBAC & Security: Enforce strict role-based access for Admin, Inventory Manager, Cashier, and Customer.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
    print("Slide 6 updated (Objectives).")

    # ----------------------------------------------------
    # SLIDE 7: COMPARISON TABLE
    # ----------------------------------------------------
    s7 = prs.slides[6]
    tbl = [s for s in s7.shapes if s.has_table][0].table
    
    table_rows = [
        ("Aspect", "Existing Supermarket System", "Proposed NexCart Platform"),
        ("Checkout Flow", "Manual single-terminal cashier queue", "Dual Mode: Cashier POS + Customer Self-Checkout"),
        ("Inventory Depletion", "LIFO / FIFO or unmanaged stock", "Strict FEFO (First-Expired, First-Out) Depletion"),
        ("Stock Concurrency", "Vulnerable to race overselling", "MongoDB Replica Set ACID Multi-Doc Transactions"),
        ("Expiry Monitoring", "Manual periodic physical audits", "Automated 30-Day Expiry Radar & Critical Alerts"),
        ("Tax & Invoicing", "Generic paper slips / manual math", "Auto GST (CGST/SGST/IGST) + Authenticated PDF"),
        ("Price & Currency", "Generic currency / manual POS entry", "INR (₹) with Indian FMCG HSN & GST compliance"),
    ]

    for r_idx, row_data in enumerate(table_rows):
        row = tbl.rows[r_idx]
        for c_idx, text_val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            if r_idx == 0:
                set_text_run(p, text_val, font_name="Calibri", font_size_pt=11.5, bold=True, color_rgb=WHITE)
            elif c_idx == 2:
                set_text_run(p, text_val, font_name="Calibri", font_size_pt=10.5, bold=True, color_rgb=EMERALD_LIGHT)
            else:
                set_text_run(p, text_val, font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
    print("Slide 7 updated (Comparison Table).")

    # ----------------------------------------------------
    # SLIDE 8: SYSTEM ARCHITECTURE
    # ----------------------------------------------------
    s8 = prs.slides[7]
    for shp in s8.shapes:
        if shp.name == "Text 5":
            set_text_run(shp.text_frame.paragraphs[0], "PRESENTATION LAYER", font_name="Calibri", font_size_pt=10.0, bold=True, color_rgb=INDIGO_LIGHT, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 7":
            set_text_run(shp.text_frame.paragraphs[0], "Web POS Terminal (Desktop)", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 9":
            set_text_run(shp.text_frame.paragraphs[0], "Mobile Self-Checkout (PWA)", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 12":
            set_text_run(shp.text_frame.paragraphs[0], "APPLICATION LAYER", font_name="Calibri", font_size_pt=10.0, bold=True, color_rgb=SKY, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 14":
            set_text_run(shp.text_frame.paragraphs[0], "Express.js API Gateway & RBAC", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 16":
            set_text_run(shp.text_frame.paragraphs[0], "FEFO Depletion & Stock Engine", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 18":
            set_text_run(shp.text_frame.paragraphs[0], "ACID Checkout & Order Engine", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 21":
            set_text_run(shp.text_frame.paragraphs[0], "PERSISTENCE & OUTPUT", font_name="Calibri", font_size_pt=10.0, bold=True, color_rgb=EMERALD_LIGHT, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 23":
            set_text_run(shp.text_frame.paragraphs[0], "Live Admin & POS Dashboard", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 25":
            set_text_run(shp.text_frame.paragraphs[0], "GST Thermal & PDF Invoices", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 27":
            set_text_run(shp.text_frame.paragraphs[0], "Real-Time Audit & Socket Alerts", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 28":
            set_text_run(shp.text_frame.paragraphs[0], "MongoDB 7 Multi-Document ACID Transactions • Replica Set Persistence", font_name="Calibri", font_size_pt=10.5, bold=True, color_rgb=EMERALD_LIGHT, align=PP_ALIGN.CENTER)

    # Add 3rd item to Presentation Layer column (left=0.70, top=3.39) to balance the 3 boxes
    extra_shp = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.70), Inches(3.39), Inches(2.60), Inches(0.52))
    extra_shp.fill.solid()
    extra_shp.fill.fore_color.rgb = SLATE_900
    extra_shp.line.color.rgb = RGBColor(0x33, 0x41, 0x55)
    extra_shp.line.width = Pt(1.0)
    extra_tb = s8.shapes.add_textbox(Inches(0.70), Inches(3.39), Inches(2.60), Inches(0.52))
    set_text_run(extra_tb.text_frame.paragraphs[0], "Barcode & SKU Scanner Feed", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=WHITE, align=PP_ALIGN.CENTER)

    print("Slide 8 updated (Architecture).")

    # ----------------------------------------------------
    # SLIDE 9: TECHNOLOGIES USED
    # ----------------------------------------------------
    s9 = prs.slides[8]
    for shp in s9.shapes:
        if shp.name == "Text 5":
            set_text_run(shp.text_frame.paragraphs[0], "React 18 + Vite", font_name="Calibri", font_size_pt=12.5, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 6":
            set_text_run(shp.text_frame.paragraphs[0], "High-performance SPA with Tailwind CSS, Lucide icons, responsive layout for desktop POS and mobile self-checkout.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 8":
            set_text_run(shp.text_frame.paragraphs[0], "Node.js + Express.js", font_name="Calibri", font_size_pt=12.5, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 9":
            set_text_run(shp.text_frame.paragraphs[0], "RESTful API backend with modular MVC architecture, JWT authentication, rate limiting, and RBAC authorization middleware.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 11":
            set_text_run(shp.text_frame.paragraphs[0], "MongoDB 7 + Mongoose", font_name="Calibri", font_size_pt=12.5, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 12":
            set_text_run(shp.text_frame.paragraphs[0], "Document database utilizing multi-document ACID transactions with replica-set consistency and compound indexes for high throughput.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 14":
            set_text_run(shp.text_frame.paragraphs[0], "Tailwind CSS 3.4", font_name="Calibri", font_size_pt=12.5, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 15":
            set_text_run(shp.text_frame.paragraphs[0], "Modern 2026 SaaS design system with emerald brand identity, dark/light theme tokens, and accessible responsive components.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 17":
            set_text_run(shp.text_frame.paragraphs[0], "Socket.io & Recharts", font_name="Calibri", font_size_pt=12.5, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 18":
            set_text_run(shp.text_frame.paragraphs[0], "Real-time bidirectional event pipeline for live inventory updates alongside interactive KPI charts, revenue analytics, and stock heatmaps.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 20":
            set_text_run(shp.text_frame.paragraphs[0], "PDFKit & Security Suite", font_name="Calibri", font_size_pt=12.5, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 21":
            set_text_run(shp.text_frame.paragraphs[0], "Server-side cryptographic JWT tokens, bcrypt password hashing, and dynamic vector PDF invoice rendering with GST tax breakdowns.", font_name="Calibri", font_size_pt=10.5, bold=False, color_rgb=SLATE_200)
    print("Slide 9 updated (Technologies).")

    # ----------------------------------------------------
    # SLIDE 10: RESULTS & IMPLEMENTATION
    # ----------------------------------------------------
    s10 = prs.slides[9]
    for shp in s10.shapes:
        if shp.name == "Text 5":
            set_text_run(shp.text_frame.paragraphs[0], "168 Tests", font_name="Calibri", font_size_pt=30.0, bold=True, color_rgb=INDIGO_LIGHT, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 6":
            set_text_run(shp.text_frame.paragraphs[0], "100% Passed (14 Suites)", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 8":
            set_text_run(shp.text_frame.paragraphs[0], "< 1.2 sec", font_name="Calibri", font_size_pt=30.0, bold=True, color_rgb=EMERALD_LIGHT, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 9":
            set_text_run(shp.text_frame.paragraphs[0], "Avg. Checkout Speed", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 11":
            set_text_run(shp.text_frame.paragraphs[0], "0%", font_name="Calibri", font_size_pt=30.0, bold=True, color_rgb=SKY, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 12":
            set_text_run(shp.text_frame.paragraphs[0], "Overselling Concurrency", font_name="Calibri", font_size_pt=9.5, bold=False, color_rgb=SLATE_400, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 14":
            set_text_run(shp.text_frame.paragraphs[0], "Implementation & Verification Steps", font_name="Calibri", font_size_pt=13.0, bold=True, color_rgb=INDIGO_LIGHT)
        elif shp.name == "Text 15":
            set_text_run(shp.text_frame.paragraphs[0], "1. System Architecture & Schema Modeling (Users, Products, Batches)", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 16":
            set_text_run(shp.text_frame.paragraphs[0], "2. FEFO Depletion Engine with Batch Expiry Sorting & Allocation", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 17":
            set_text_run(shp.text_frame.paragraphs[0], "3. MongoDB Replica-Set ACID Transactions with Rollback Logic", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 18":
            set_text_run(shp.text_frame.paragraphs[0], "4. Cashier POS Terminal with Cart Hold/Recall & Barcode Integration", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 19":
            set_text_run(shp.text_frame.paragraphs[0], "5. Indian Retail Localization: INR (₹) Pricing, HSN & GST Engine", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 20":
            set_text_run(shp.text_frame.paragraphs[0], "6. Multi-Tier Role Governance (Admin, Manager, Cashier, Customer)", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 21":
            set_text_run(shp.text_frame.paragraphs[0], "7. Comprehensive Test Automation (168 Unit, Integration & Security Tests)", font_name="Calibri", font_size_pt=10.0, bold=False, color_rgb=SLATE_200)
    print("Slide 10 updated (Results).")

    # ----------------------------------------------------
    # SLIDE 11: CONCLUSION
    # ----------------------------------------------------
    s11 = prs.slides[10]
    for shp in s11.shapes:
        if shp.name == "Text 2":
            set_text_run(shp.text_frame.paragraphs[0], "Conclusion — NexCart Supermarket Automation", font_name="Calibri", font_size_pt=26.0, bold=True, color_rgb=WHITE)
        elif shp.name == "Text 6":
            set_text_run(shp.text_frame.paragraphs[0], "Successfully engineered and verified a full-stack automated supermarket system solving traditional checkout bottlenecks and inventory shrinkage.", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 9":
            set_text_run(shp.text_frame.paragraphs[0], "Enforced automated FEFO batch depletion and 30-day expiry radar, significantly reducing perishable food waste in retail environments.", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 12":
            set_text_run(shp.text_frame.paragraphs[0], "Eliminated inventory race conditions and double-spending through robust MongoDB replica-set ACID transactions and compensation fallbacks.", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 15":
            set_text_run(shp.text_frame.paragraphs[0], "Tailored end-to-end for the Indian retail ecosystem with seamless INR (₹) pricing, GST tax computation, and authenticated PDF billing.", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
        elif shp.name == "Text 18":
            set_text_run(shp.text_frame.paragraphs[0], "Validated with 168 automated tests achieving 100% pass rate across 14 suites, demonstrating enterprise-grade stability, security, and scalability.", font_name="Calibri", font_size_pt=11.5, bold=False, color_rgb=SLATE_200)
    print("Slide 11 updated (Conclusion).")

    # ----------------------------------------------------
    # SLIDE 12: THANK YOU
    # ----------------------------------------------------
    s12 = prs.slides[11]
    for shp in s12.shapes:
        if shp.name == "Text 3":
            set_text_run(shp.text_frame.paragraphs[0], "Thank You", font_name="Cambria", font_size_pt=60.0, bold=True, color_rgb=WHITE, align=PP_ALIGN.CENTER)
        elif shp.name == "Text 4":
            set_text_run(shp.text_frame.paragraphs[0], "Department of Computer Science & Engineering", font_name="Arial", font_size_pt=15.0, bold=False, color_rgb=RGBColor(0xAA, 0xAA, 0xAA), align=PP_ALIGN.CENTER)
        elif shp.name == "Text 5":
            tf = shp.text_frame
            p1 = tf.paragraphs[0]
            set_text_run(p1, "C.V. Raman Global University, Bhubaneswar", font_name="Arial", font_size_pt=13.0, bold=True, color_rgb=RGBColor(0xCB, 0xD5, 0xE1), align=PP_ALIGN.CENTER)
            p2 = tf.add_paragraph()
            set_text_run(p2, "INDUSTRIAL INTERNSHIP PROJECT SUBMISSION", font_name="Arial", font_size_pt=11.0, bold=False, color_rgb=RGBColor(0x88, 0x88, 0x88), align=PP_ALIGN.CENTER)
    print("Slide 12 updated (Thank You).")

    # Save final presentation
    prs.save(OUT_PPTX)
    print(f"\nSuccessfully generated and saved final presentation to:\n{OUT_PPTX}")

if __name__ == "__main__":
    create_presentation()
