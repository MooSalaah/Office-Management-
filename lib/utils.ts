import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Saudi Riyal symbol utility
export const SAR_SYMBOL = "﷼";

// Convert standard numbers to Arabic numerals
export function toArabicNumerals(input: string | number): string {
	const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
	return input.toString().replace(/[0-9]/g, (d) => arabicDigits[parseInt(d)]);
}

// Format currency with Saudi Riyal symbol (symbol on left, Arabic numerals)
export function formatCurrency(amount: number): string {
	return `${toArabicNumerals(amount.toLocaleString("ar-EG"))} ${SAR_SYMBOL}`;
}

// Format amount without symbol (Arabic numerals)
export function formatAmount(amount: number): string {
	return toArabicNumerals(amount.toLocaleString("ar-EG"));
}

// Utility to wrap any number in bold, large font and Arabic numerals
// (Moved to a React component in components/ui/ArabicNumber.tsx)

// Get Saudi Riyal symbol image
export function getSARIcon(): string {
	return "/Saudi_Riyal_Symbol.png";
}

// تحويل النص العربي إلى إنجليزي (حروف لاتينية)
export function transliterateArabicToEnglish(text: string): string {
	const map: { [key: string]: string } = {
		ا: "a",
		أ: "a",
		إ: "i",
		آ: "a",
		ب: "b",
		ت: "t",
		ث: "th",
		ج: "j",
		ح: "h",
		خ: "kh",
		د: "d",
		ذ: "dh",
		ر: "r",
		ز: "z",
		س: "s",
		ش: "sh",
		ص: "s",
		ض: "d",
		ط: "t",
		ظ: "z",
		ع: "a",
		غ: "gh",
		ف: "f",
		ق: "q",
		ك: "k",
		ل: "l",
		م: "m",
		ن: "n",
		ه: "h",
		و: "w",
		ي: "y",
		ى: "a",
		ئ: "y",
		ء: "a",
		ؤ: "w",
		ة: "a",
		ﻻ: "la",
		" ": "",
		// أرقام عربية
		"٠": "0",
		"١": "1",
		"٢": "2",
		"٣": "3",
		"٤": "4",
		"٥": "5",
		"٦": "6",
		"٧": "7",
		"٨": "8",
		"٩": "9",
	};
	return text
		.split("")
		.map((char) => map[char] || char)
		.join("")
		.replace(/[^a-zA-Z0-9]/g, "");
}
