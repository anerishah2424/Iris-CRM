
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        LevelFormat, PageBreak } = require('docx');
const fs = require('fs');

const content = {"executive_summary": "Error generating proposal", "error": "404 models/gemma-3-1b-it is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods."};
const clientInfo = {"company_name": "Pandit Deendayal Energy University", "industry": "Education", "company_size": "1000+", "location": {"city": "Vadodara", "state": "Gujarat", "country": "India"}, "budget_range": null};
const products = [{"product_name": "COSEC ARGO FACE300E", "category": "Terminal", "quantity": 1, "unit_price": 29500.0, "justification": "Recommended based on requirements", "technical_fit_score": 50.0}, {"product_name": "COSEC ATOM RD100E", "category": "Reader", "quantity": 1, "unit_price": 3800.0, "justification": "Recommended based on requirements", "technical_fit_score": 50.0}, {"product_name": "COSEC ARGO FACE210E", "category": "Terminal", "quantity": 1, "unit_price": 19000.0, "justification": "Recommended based on requirements", "technical_fit_score": 50.0}, {"product_name": "COSEC ATOM RD100E", "category": "Reader", "quantity": 1, "unit_price": 3800.0, "justification": "Recommended based on requirements", "technical_fit_score": 50.0}, {"product_name": "COSEC ARGO FACEE", "category": "Terminal", "quantity": 1, "unit_price": 19000.0, "justification": "Recommended based on requirements", "technical_fit_score": 50.0}];
const pricing = {"subtotal_products": 75100.0, "installation_cost": 15020.0, "maintenance_annual": 11265.0, "total_investment": 90120.0, "sla_tier": "Premium"};

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "PROPOSAL", size: 48, bold: true, color: "2E75B6" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2880 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Security & Telecom Solutions", size: 32, color: "666666" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 720 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Prepared for:", size: 24, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 120 }
      }),
      new Paragraph({
        children: [new TextRun({ text: clientInfo.company_name, size: 28, bold: true, color: "2E75B6" })],
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), size: 20, color: "666666" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 }
      }),
      new Paragraph({ children: [new PageBreak()] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
      new Paragraph({ children: [new TextRun(content.executive_summary || "Executive summary...")], spacing: { after: 240 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Understanding Your Needs")] }),
      new Paragraph({ children: [new TextRun(content.understanding_needs || "Requirements...")], spacing: { after: 240 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Proposed Solution")] }),
      new Paragraph({ children: [new TextRun(content.proposed_solution || "Solution...")], spacing: { after: 240 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Product Recommendations")] }),
      new Paragraph({ children: [new TextRun(content.product_recommendations || "Products...")], spacing: { after: 240 } }),
      
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3744, 1872, 1872, 1872],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 3744, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Product", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Quantity", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Unit Price", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA }, shading: { fill: "2E75B6", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, color: "FFFFFF" })] })] })
            ]
          }),
          ...products.map((p, i) => new TableRow({
            children: [
              new TableCell({ borders, width: { size: 3744, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun(p.product_name)] })] }),
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun(p.quantity.toString())], alignment: AlignmentType.CENTER })] }),
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun("$" + p.unit_price.toLocaleString('en-US', {minimumFractionDigits: 2}))], alignment: AlignmentType.RIGHT })] }),
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun("$" + (p.quantity * p.unit_price).toLocaleString('en-US', {minimumFractionDigits: 2}))], alignment: AlignmentType.RIGHT })] })
            ]
          }))
        ]
      }),
      
      new Paragraph({ text: "", spacing: { after: 480 } }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Implementation Plan")] }),
      new Paragraph({ children: [new TextRun(content.implementation_plan || "Implementation...")], spacing: { after: 240 } }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Investment Summary")] }),
      new Paragraph({ children: [new TextRun(content.investment_summary || "Investment...")], spacing: { after: 240 } }),
      
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6552, 2808],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6552, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "Products & Equipment", bold: true })] })] }),
            new TableCell({ borders, width: { size: 2808, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun("$" + pricing.subtotal_products.toLocaleString('en-US', {minimumFractionDigits: 2}))], alignment: AlignmentType.RIGHT })] })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6552, type: WidthType.DXA }, shading: { fill: "F9F9F9", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "Installation & Configuration", bold: true })] })] }),
            new TableCell({ borders, width: { size: 2808, type: WidthType.DXA }, shading: { fill: "F9F9F9", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun("$" + pricing.installation_cost.toLocaleString('en-US', {minimumFractionDigits: 2}))], alignment: AlignmentType.RIGHT })] })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6552, type: WidthType.DXA }, shading: { fill: "E8F4F8", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "TOTAL INVESTMENT", bold: true, size: 26 })] })] }),
            new TableCell({ borders, width: { size: 2808, type: WidthType.DXA }, shading: { fill: "E8F4F8", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: "$" + pricing.total_investment.toLocaleString('en-US', {minimumFractionDigits: 2}), bold: true, size: 26 })], alignment: AlignmentType.RIGHT })] })
          ] }),
          new TableRow({ children: [
            new TableCell({ borders, width: { size: 6552, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun("Annual Maintenance (" + pricing.sla_tier + " SLA)")] })] }),
            new TableCell({ borders, width: { size: 2808, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun("$" + pricing.maintenance_annual.toLocaleString('en-US', {minimumFractionDigits: 2}) + "/year")], alignment: AlignmentType.RIGHT })] })
          ] })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('D:/MATRIX/Iris/agent_server/proposal_techcorp.docx', buffer);
  console.log('Document created');
});
