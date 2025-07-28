import { getCurrentUser } from "./auth";
import { Transaction, Project, Client, CompanySettings } from './types';

export interface InvoiceData {
	companyName: string;
	clientName: string;
	amount: number;
	paymentMethod: string;
	projectDetails: string;
	description?: string;
	transactionDate: string;
	invoiceNumber: string;
	companyLogo?: string | undefined;
	companyStamp?: string | undefined;
	companySignature?: string | undefined;
	remainingAmount?: number;
	payerName?: string;
	recipientName?: string;
	isAdvancePayment?: boolean;
}

export class InvoiceGenerator {
	private static generateInvoiceNumber(): string {
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const random = Math.floor(Math.random() * 1000)
			.toString()
			.padStart(3, "0");
		return `INV-${year}${month}${day}-${random}`;
	}

	private static convertToHijriDate(gregorianDate: string): string {
		const date = new Date(gregorianDate);
		
		// استخدام التاريخ الهجري الصحيح للعام 2025
		// اليوم 3 صفر 1447 هـ
		const hijriMonths = [
			"محرم",
			"صفر",
			"ربيع الأول",
			"ربيع الآخر",
			"جمادى الأولى",
			"جمادى الآخرة",
			"رجب",
			"شعبان",
			"رمضان",
			"شوال",
			"ذو القعدة",
			"ذو الحجة",
		];

		// تحويل الأرقام إلى حروف عربية
		const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
		const convertToArabic = (num: number) => {
			return num
				.toString()
				.split("")
				.map((digit) => arabicNumbers[parseInt(digit)])
				.join("");
		};

		// حساب التاريخ الهجري الصحيح
		const gregorianYear = date.getFullYear();
		const gregorianMonth = date.getMonth() + 1;
		const gregorianDay = date.getDate();
		
		// خوارزمية تحويل دقيقة للتاريخ الهجري
		// التاريخ الحالي: 28 يوليو 2025 = 3 صفر 1447
		const baseGregorianDate = new Date(2025, 6, 28); // 28 يوليو 2025
		const baseHijriDate = { year: 1447, month: 1, day: 3 }; // 3 صفر 1447
		
		// حساب الفرق بالأيام
		const diffTime = date.getTime() - baseGregorianDate.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		
		// حساب التاريخ الهجري
		let hijriYear = baseHijriDate.year;
		let hijriMonth = baseHijriDate.month;
		let hijriDay = baseHijriDate.day + diffDays;
		
		// تصحيح الشهر واليوم
		const hijriMonthDays = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29]; // تقريبي
		
		// التأكد من أن hijriMonth في النطاق الصحيح
		while (hijriDay > 0 && hijriMonth <= 12) {
			const monthIndex = Math.max(0, Math.min(11, hijriMonth - 1));
			const currentMonthDays = hijriMonthDays[monthIndex];
			if (currentMonthDays !== undefined && hijriDay > currentMonthDays) {
				hijriDay -= currentMonthDays;
				hijriMonth++;
				if (hijriMonth > 12) {
					hijriMonth = 1;
					hijriYear++;
				}
			} else {
				break;
			}
		}
		
		// التأكد من أن اليوم صحيح
		if (hijriDay < 1) {
			hijriMonth--;
			if (hijriMonth < 1) {
				hijriMonth = 12;
				hijriYear--;
			}
			// التأكد من أن hijriMonth في النطاق قبل الوصول للمصفوفة
			const monthIndex = Math.max(0, Math.min(11, hijriMonth - 1));
			const monthDays = hijriMonthDays[monthIndex];
			if (monthDays !== undefined) {
				hijriDay = monthDays + hijriDay;
			}
		}

		return `${convertToArabic(hijriDay)} ${
			hijriMonths[hijriMonth - 1]
		} ${convertToArabic(hijriYear)} هـ`;
	}

	private static convertToArabicDate(gregorianDate: string): string {
		const date = new Date(gregorianDate);
		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();

		const arabicMonths = [
			"يناير",
			"فبراير",
			"مارس",
			"أبريل",
			"مايو",
			"يونيو",
			"يوليو",
			"أغسطس",
			"سبتمبر",
			"أكتوبر",
			"نوفمبر",
			"ديسمبر",
		];

		// تحويل الأرقام إلى حروف عربية
		const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
		const convertToArabic = (num: number) => {
			return num
				.toString()
				.split("")
				.map((digit) => arabicNumbers[parseInt(digit)])
				.join("");
		};

		return `${convertToArabic(day)} ${
			arabicMonths[month - 1]
		} ${convertToArabic(year)} م`;
	}

	private static translatePaymentMethod(method: string): string {
		const paymentMethods: { [key: string]: string } = {
			cash: "نقدي",
			transfer: "تحويل بنكي",
			network: "شبكة",
			pos: "شبكة",
			نقدي: "نقدي",
			تحويل: "تحويل بنكي",
			شبكة: "شبكة",
			نقداً: "نقدي",
			"تحويل بنكي": "تحويل بنكي",
		};

		return paymentMethods[method.toLowerCase()] || method;
	}

	static generateInvoiceHTML(data: InvoiceData & { address?: string; phone?: string; email?: string; website?: string | undefined }): string {
		const formattedDate = this.convertToArabicDate(data.transactionDate);
		const hijriDate = this.convertToHijriDate(data.transactionDate);
		const translatedPaymentMethod = this.translatePaymentMethod(data.paymentMethod);
		const formattedAmount = data.amount.toLocaleString("ar-SA");
		const formattedRemainingAmount = data.remainingAmount ? data.remainingAmount.toLocaleString("ar-SA") : "0";
		// اسم المستلم من المستخدم الحالي فقط
		let recipientDisplay = data.recipientName;
		if (typeof window !== "undefined") {
			const user = getCurrentUser && getCurrentUser();
			recipientDisplay = user && user.name ? user.name : "غير محدد";
		}
		// اسم الدافع
		let payerDisplay = data.payerName || "غير محدد";
		let projectPhrase = data.isAdvancePayment
			? `دفعة مقدمة من مشروع <strong>${data.projectDetails}</strong>`
			: `وذلك مقابل <strong>${data.description || data.projectDetails}</strong>`;
		return `
			<!DOCTYPE html>
			<html dir="rtl" lang="ar">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>فاتورة</title>
				<style>
					@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
					* { margin: 0; padding: 0; box-sizing: border-box; }
					body { font-family: 'Amiri', serif; background: #f8f9fa; color: #333; line-height: 1.7; position: relative; }
					.invoice-container { max-width: 800px; margin: 20px auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.08); border-radius: 10px; overflow: hidden; position: relative; border: 1px solid #e9ecef; min-height: unset; }
					.invoice-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px 12px 24px 12px; text-align: center; position: relative; border-bottom: 2px solid #5a6fd8; min-height: 110px; }
					.company-info { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; gap: 18px; flex-direction: row-reverse; }
					.company-logo { width: 72px; height: 72px; object-fit: contain; order: 2; }
					.company-name { font-size: 32px; font-weight: 900; order: 1; letter-spacing: 1px; }
					.invoice-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
					.invoice-header-flex { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 0; }
					.invoice-header-box { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 12px; font-size: 15px; border: 1px solid #fff; min-width: 110px; text-align: right; }
					.invoice-header-box-small { min-width: 80px; font-size: 13px; padding: 4px 8px; }
					.invoice-header-dates { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 120px; text-align: right; }
					.invoice-content { padding: 18px 18px 12px 18px; }
					.invoice-text { font-size: 20px; line-height: 2.2; text-align: center; margin-bottom: 18px; color: #2c3e50; font-weight: 700; padding: 14px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
					.receipt-text { font-size: 16px; font-weight: 700; text-align: center; margin-bottom: 18px; color: #27ae60; background: #d4edda; padding: 10px; border-radius: 8px; border: 1px solid #c3e6cb; }
					.invoice-details { background: #f8f9fa; padding: 14px; border-radius: 10px; margin-bottom: 14px; border: 2px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
					.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e9ecef; font-size: 15px; }
					.detail-row:last-child { border-bottom: none; }
					.detail-label { font-weight: 700; color: #495057; font-size: 15px; }
					.detail-value { font-weight: 700; color: #2c3e50; font-size: 15px; }
					.amount-value, .remaining-amount { display: flex; align-items: center; direction: rtl; justify-content: flex-end; font-size: 18px; font-weight: bold; }
					.currency-text { font-family: 'Amiri', serif; margin-left: 4px; font-weight: bold; color: #27ae60; font-size: 16px; }
					.invoice-footer { display: flex; flex-direction: column; align-items: stretch; padding: 0; border-top: 2px solid #e9ecef; background: #f8f9fa; border-radius: 0 0 10px 10px; margin-top: 0; }
					.footer-main { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 18px 0 18px; }
					.signature-section, .stamp-section { text-align: center; flex: 1; padding: 0; background: white; border-radius: 8px; margin: 0 18px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
					.company-signature, .company-stamp { width: 150px; height: 150px; object-fit: contain; margin-bottom: 12px; background: #fff; border-radius: 8px; padding: 0; border: none; }
					.signature-line { width: 120px; height: 2px; background: #333; margin: 12px auto; }
					.signature-text, .stamp-text { font-size: 18px; color: #6c757d; font-weight: 700; }
					.footer-info { background: #e9ecef; color: #333; border-radius: 0 0 10px 10px; padding: 12px 18px; text-align: center; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
					.footer-info span { display: block; }
					.notes-section { margin-top: 12px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #888; min-height: 24px; }
					@media print { .print-button { display: none; } body { background: white; } .invoice-container { box-shadow: none; margin: 0; } }
				</style>
			</head>
			<body>
				<button class="print-button" onclick="window.print()">🖨️ طباعة الفاتورة</button>
				<div class="invoice-container">
					<div class="invoice-header">
						<div class="company-info">
							${data.companyLogo ? `<img src="${data.companyLogo}" alt="شعار الشركة" class="company-logo">` : ""}
							<div class="company-name">${data.companyName}</div>
						</div>
						<div class="invoice-header-flex">
							<div class="invoice-header-dates invoice-header-box invoice-header-box-small">
								<div>التاريخ الميلادي: ${formattedDate}</div>
								<div>التاريخ الهجري: ${hijriDate}</div>
							</div>
							<div class="invoice-title">فاتورة إيصال</div>
							<div class="invoice-header-box invoice-header-box-small" style="min-width:60px; font-size:12px;">رقم الفاتورة<br>${data.invoiceNumber}</div>
						</div>
					</div>
					<div class="invoice-content">
						<div class="invoice-text">
							استلمنا نحن <strong>${data.companyName}</strong> من المكرم <strong>${payerDisplay}</strong> مبلغ وقدره <strong>(<span class="currency-text">${formattedAmount} ريال سعودي</span>)</strong> عن طريق <strong>${translatedPaymentMethod}</strong> ${projectPhrase}
						</div>
						<div class="receipt-text">وهذا إيصال منا بذلك</div>
						<div class="invoice-details">
							<div class="detail-row">
								<span class="detail-label">اسم المستلم:</span>
								<span class="detail-value">${recipientDisplay}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">المبلغ:</span>
								<span class="detail-value amount-value">
									${formattedAmount}
									<span class="currency-text"> ريال سعودي</span>
								</span>
							</div>
							${data.remainingAmount && data.remainingAmount > 0 ? `<div class="detail-row"><span class="detail-label">المبلغ المتبقي:</span><span class="detail-value remaining-amount">${formattedRemainingAmount}<span class="currency-text"> ريال سعودي</span></span></div>` : ""}
							<div class="detail-row">
								<span class="detail-label">طريقة الدفع:</span>
								<span class="detail-value">${translatedPaymentMethod}</span>
							</div>
						</div>
						<div class="notes-section">ملاحظات:</div>
					</div>
					<div class="invoice-footer">
						<div class="footer-main">
						<div class="signature-section">
								${data.companySignature ? `<img src="${data.companySignature}" alt="توقيع المكتب" class="company-signature">` : `<div class="signature-line"></div>`}
							<div class="signature-text">التوقيع</div>
						</div>
						<div class="stamp-section">
								${data.companyStamp ? `<img src="${data.companyStamp}" alt="ختم الشركة" class="company-stamp">` : ""}
							<div class="stamp-text">ختم الشركة</div>
							</div>
						</div>
						<div class="footer-info">
							<span>${data.companyName}</span>
							${data.address ? `<span>${data.address}</span>` : ""}
							${data.phone || data.email || data.website ? `<span>${data.website ? data.website : ""}${data.email ? (data.website ? " | " : "") + data.email : ""}${data.phone ? (data.website || data.email ? " | " : "") + data.phone : ""}</span>` : ""}
						</div>
					</div>
				</div>
			</body>
			</html>
		`;
	}

	static generateInvoiceFromTransaction(
		transaction: Transaction,
		project: Project,
		client: Client,
		companySettings: CompanySettings
	): string {
		const invoiceData: InvoiceData & { address?: string; phone?: string; email?: string; website?: string | undefined } = {
			companyName: companySettings.name || "الركن الجديد للاستشارات الهندسية",
			clientName: client?.name || transaction.clientName || "غير محدد",
			amount: transaction.amount,
			paymentMethod: transaction.paymentMethod || "نقداً",
			projectDetails: project?.name || transaction.projectName || "خدمات هندسية",
			description: transaction.description,
			transactionDate: transaction.date,
			invoiceNumber: this.generateInvoiceNumber(),
			companyLogo: companySettings.logo,
			companyStamp: companySettings.stamp,
			companySignature: companySettings.signature,
			remainingAmount: transaction.remainingAmount || 0,
			payerName: transaction.payerName || client?.name || transaction.clientName || "غير محدد",
			recipientName: "",
			isAdvancePayment: transaction.isAdvancePayment || false,
			address: companySettings.address,
			phone: companySettings.phone,
			email: companySettings.email,
			website: companySettings.website,
		};

		return this.generateInvoiceHTML(invoiceData);
	}

	static openInvoiceInNewTab(htmlContent: string): void {
		const newWindow = window.open("", "_blank");
		if (newWindow) {
			newWindow.document.write(htmlContent);
			newWindow.document.close();
		}
	}

	static downloadInvoiceAsHTML(
		htmlContent: string,
		filename: string = "invoice.html"
	): void {
		const blob = new Blob([htmlContent], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
}
