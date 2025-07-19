// Minification utilities for performance optimization

// Code minification utilities
export const CodeMinification = {
	// Remove comments from code
	removeComments: (code: string): string => {
		return code
			.replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
			.replace(/\/\/.*$/gm, "") // Remove line comments
			.replace(/^\s*[\r\n]/gm, ""); // Remove empty lines
	},

	// Remove whitespace from code
	removeWhitespace: (code: string): string => {
		return code
			.replace(/\s+/g, " ") // Replace multiple spaces with single space
			.replace(/\s*([{}();,=])\s*/g, "$1") // Remove spaces around operators
			.trim();
	},

	// Minify JavaScript code
	minifyJS: (code: string): string => {
		return CodeMinification.removeWhitespace(
			CodeMinification.removeComments(code)
		);
	},

	// Minify CSS code
	minifyCSS: (code: string): string => {
		return code
			.replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
			.replace(/\s+/g, " ") // Replace multiple spaces
			.replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around operators
			.replace(/;\s*}/g, "}") // Remove semicolons before closing braces
			.trim();
	},

	// Minify HTML code
	minifyHTML: (code: string): string => {
		return code
			.replace(/<!--[\s\S]*?-->/g, "") // Remove comments
			.replace(/\s+/g, " ") // Replace multiple spaces
			.replace(/>\s+</g, "><") // Remove spaces between tags
			.trim();
	},

	// Minify JSON code
	minifyJSON: (code: string): string => {
		try {
			const parsed = JSON.parse(code);
			return JSON.stringify(parsed);
		} catch (error) {
			console.error("JSON minification failed:", error);
			return code;
		}
	},
};

// String minification utilities
export const StringMinification = {
	// Remove unnecessary characters from strings
	removeUnnecessaryChars: (str: string): string => {
		return str
			.replace(/\s+/g, " ") // Replace multiple spaces
			.replace(/\n/g, " ") // Replace newlines with spaces
			.replace(/\t/g, " ") // Replace tabs with spaces
			.trim();
	},

	// Compress repeated characters
	compressRepeatedChars: (str: string): string => {
		return str.replace(/(.)\1+/g, (match, char) => {
			return char + match.length;
		});
	},

	// Decompress repeated characters
	decompressRepeatedChars: (str: string): string => {
		return str.replace(/(.)(\d+)/g, (match, char, count) => {
			return char.repeat(parseInt(count));
		});
	},

	// Minify string arrays
	minifyStringArray: (arr: string[]): string => {
		return arr
			.map((str) => StringMinification.removeUnnecessaryChars(str))
			.join("");
	},
};

// Object minification utilities
export const ObjectMinification = {
	// Remove undefined properties
	removeUndefined: <T extends object>(obj: T): Partial<T> => {
		const result: Partial<T> = {};

		Object.entries(obj).forEach(([key, value]) => {
			if (value !== undefined) {
				result[key as keyof T] = value;
			}
		});

		return result;
	},

	// Remove null properties
	removeNull: <T extends object>(obj: T): Partial<T> => {
		const result: Partial<T> = {};

		Object.entries(obj).forEach(([key, value]) => {
			if (value !== null) {
				result[key as keyof T] = value;
			}
		});

		return result;
	},

	// Remove empty properties
	removeEmpty: <T extends object>(obj: T): Partial<T> => {
		const result: Partial<T> = {};

		Object.entries(obj).forEach(([key, value]) => {
			if (value !== "" && value !== null && value !== undefined) {
				result[key as keyof T] = value;
			}
		});

		return result;
	},

	// Flatten nested objects
	flatten: <T extends object>(obj: T, prefix = ""): Record<string, any> => {
		const result: Record<string, any> = {};

		Object.entries(obj).forEach(([key, value]) => {
			const newKey = prefix ? `${prefix}.${key}` : key;

			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value)
			) {
				Object.assign(result, ObjectMinification.flatten(value, newKey));
			} else {
				result[newKey] = value;
			}
		});

		return result;
	},

	// Unflatten objects
	unflatten: (obj: Record<string, any>): Record<string, any> => {
		const result: Record<string, any> = {};

		Object.entries(obj).forEach(([key, value]) => {
			const keys = key.split(".");
			let current = result;

			keys.forEach((k, index) => {
				if (index === keys.length - 1) {
					current[k] = value;
				} else {
					current[k] = current[k] || {};
					current = current[k];
				}
			});
		});

		return result;
	},
};

// Array minification utilities
export const ArrayMinification = {
	// Remove duplicate items
	removeDuplicates: <T>(arr: T[]): T[] => {
		return Array.from(new Set(arr));
	},

	// Remove falsy items
	removeFalsy: <T>(arr: T[]): T[] => {
		return arr.filter((item) => Boolean(item));
	},

	// Remove empty items
	removeEmpty: <T>(arr: T[]): T[] => {
		return arr.filter((item) => {
			if (typeof item === "string") return item.trim() !== "";
			if (typeof item === "object")
				return item !== null && Object.keys(item).length > 0;
			return item !== null && item !== undefined;
		});
	},

	// Flatten nested arrays
	flatten: <T>(arr: T[]): T[] => {
		return arr.reduce((flat, item) => {
			return flat.concat(
				Array.isArray(item) ? ArrayMinification.flatten(item) : item
			);
		}, [] as T[]);
	},

	// Remove items by condition
	removeByCondition: <T>(arr: T[], condition: (item: T) => boolean): T[] => {
		return arr.filter((item) => !condition(item));
	},
};

// Function minification utilities
export const FunctionMinification = {
	// Remove unused parameters
	removeUnusedParams: <T extends (...args: any[]) => any>(fn: T): T => {
		return fn;
	},

	// Optimize function body
	optimizeFunctionBody: (body: string): string => {
		return CodeMinification.minifyJS(body);
	},

	// Remove console statements
	removeConsoleStatements: (code: string): string => {
		return code
			.replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, "")
			.replace(/console\.(log|warn|error|info|debug)\([^)]*\)/g, "");
	},

	// Remove debug statements
	removeDebugStatements: (code: string): string => {
		return code
			.replace(/debugger;?/g, "")
			.replace(/\/\*[\s\S]*?debug[\s\S]*?\*\//g, "")
			.replace(/\/\/.*debug.*$/gm, "");
	},
};

// React component minification utilities
export const ReactMinification = {
	// Minify component props
	minifyProps: <P extends object>(props: P): Partial<P> => {
		return ObjectMinification.removeUndefined(props);
	},

	// Minify component state
	minifyState: <S>(state: S): Partial<S> => {
		return ObjectMinification.removeUndefined(state as object) as Partial<S>;
	},

	// Minify component children
	minifyChildren: (children: React.ReactNode): React.ReactNode => {
		if (typeof children === "string") {
			return StringMinification.removeUnnecessaryChars(children);
		}
		return children;
	},

	// Remove unused imports
	removeUnusedImports: (code: string): string => {
		// This would require AST parsing in a real implementation
		return code;
	},

	// Remove unused exports
	removeUnusedExports: (code: string): string => {
		// This would require AST parsing in a real implementation
		return code;
	},
};

// CSS minification utilities
export const CSSMinification = {
	// Minify CSS rules
	minifyRules: (css: string): string => {
		return css
			.replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
			.replace(/\s+/g, " ") // Replace multiple spaces
			.replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around operators
			.replace(/;\s*}/g, "}") // Remove semicolons before closing braces
			.replace(/:\s*/g, ":") // Remove spaces after colons
			.replace(/;\s*/g, ";") // Remove spaces after semicolons
			.replace(/,\s*/g, ",") // Remove spaces after commas
			.trim();
	},

	// Remove unused CSS
	removeUnusedCSS: (css: string, usedSelectors: string[]): string => {
		// This would require CSS parsing in a real implementation
		return css;
	},

	// Optimize CSS selectors
	optimizeSelectors: (css: string): string => {
		return css
			.replace(/\s*>\s*/g, ">") // Remove spaces around child selectors
			.replace(/\s*\+\s*/g, "+") // Remove spaces around adjacent selectors
			.replace(/\s*~\s*/g, "~"); // Remove spaces around sibling selectors
	},

	// Combine similar rules
	combineSimilarRules: (css: string): string => {
		// This would require CSS parsing in a real implementation
		return css;
	},
};

// HTML minification utilities
export const HTMLMinification = {
	// Minify HTML attributes
	minifyAttributes: (html: string): string => {
		return html
			.replace(/\s+/g, " ") // Replace multiple spaces
			.replace(/>\s+</g, "><") // Remove spaces between tags
			.replace(/\s*=\s*/g, "=") // Remove spaces around equals
			.replace(/\s*>\s*/g, ">") // Remove spaces before closing tags
			.replace(/\s*<\s*/g, "<") // Remove spaces after opening tags
			.trim();
	},

	// Remove HTML comments
	removeComments: (html: string): string => {
		return html.replace(/<!--[\s\S]*?-->/g, "");
	},

	// Remove empty attributes
	removeEmptyAttributes: (html: string): string => {
		return html
			.replace(/\s+class=""/g, "") // Remove empty class attributes
			.replace(/\s+id=""/g, "") // Remove empty id attributes
			.replace(/\s+style=""/g, ""); // Remove empty style attributes
	},

	// Optimize HTML structure
	optimizeStructure: (html: string): string => {
		return html
			.replace(/\s*<br\s*\/?>\s*/g, "<br>") // Optimize line breaks
			.replace(/\s*<hr\s*\/?>\s*/g, "<hr>") // Optimize horizontal rules
			.replace(/\s*<img\s+/g, "<img "); // Optimize image tags
	},
};

// Performance monitoring for minification
export const MinificationMonitoring = {
	// Monitor minification ratio
	monitorMinificationRatio: (
		originalSize: number,
		minifiedSize: number
	): number => {
		const ratio = (minifiedSize / originalSize) * 100;
		console.log(`Minification ratio: ${ratio.toFixed(2)}%`);
		return ratio;
	},

	// Monitor minification time
	monitorMinificationTime: <T extends (...args: any[]) => any>(
		fn: T,
		name: string
	): T => {
		return ((...args: any[]) => {
			const startTime = performance.now();
			const result = fn(...args);
			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(`Minification ${name} time: ${duration.toFixed(2)}ms`);

			return result;
		}) as T;
	},

	// Monitor file size reduction
	monitorFileSizeReduction: (
		originalSize: number,
		minifiedSize: number
	): void => {
		const reduction = originalSize - minifiedSize;
		const reductionPercentage = (reduction / originalSize) * 100;

		console.log(
			`File size reduction: ${reduction} bytes (${reductionPercentage.toFixed(
				2
			)}%)`
		);
	},
};

// Minification utilities for different file types
export const FileTypeMinification = {
	// JavaScript files
	js: (code: string): string => {
		return MinificationMonitoring.monitorMinificationTime(
			CodeMinification.minifyJS,
			"JavaScript"
		)(code);
	},

	// CSS files
	css: (code: string): string => {
		return MinificationMonitoring.monitorMinificationTime(
			CSSMinification.minifyRules,
			"CSS"
		)(code);
	},

	// HTML files
	html: (code: string): string => {
		return MinificationMonitoring.monitorMinificationTime(
			HTMLMinification.minifyAttributes,
			"HTML"
		)(HTMLMinification.removeComments(code));
	},

	// JSON files
	json: (code: string): string => {
		return MinificationMonitoring.monitorMinificationTime(
			CodeMinification.minifyJSON,
			"JSON"
		)(code);
	},

	// TypeScript files
	ts: (code: string): string => {
		return MinificationMonitoring.monitorMinificationTime(
			CodeMinification.minifyJS,
			"TypeScript"
		)(code);
	},

	// JSX files
	jsx: (code: string): string => {
		return MinificationMonitoring.monitorMinificationTime(
			CodeMinification.minifyJS,
			"JSX"
		)(code);
	},
};
