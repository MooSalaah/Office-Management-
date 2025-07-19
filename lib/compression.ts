// Compression utilities for performance optimization

// Data compression utilities
export const DataCompression = {
	// Compress JSON data
	compressJSON: (data: any): string => {
		try {
			const jsonString = JSON.stringify(data);
			return btoa(jsonString); // Base64 encoding
		} catch (error) {
			console.error("JSON compression failed:", error);
			return JSON.stringify(data);
		}
	},

	// Decompress JSON data
	decompressJSON: (compressedData: string): any => {
		try {
			const jsonString = atob(compressedData); // Base64 decoding
			return JSON.parse(jsonString);
		} catch (error) {
			console.error("JSON decompression failed:", error);
			return JSON.parse(compressedData);
		}
	},

	// Compress string data
	compressString: (data: string): string => {
		try {
			// Simple compression using RLE (Run Length Encoding)
			let compressed = "";
			let count = 1;
			let current = data[0];

			for (let i = 1; i < data.length; i++) {
				if (data[i] === current) {
					count++;
				} else {
					compressed += count + current;
					count = 1;
					current = data[i];
				}
			}

			compressed += count + current;
			return compressed;
		} catch (error) {
			console.error("String compression failed:", error);
			return data;
		}
	},

	// Decompress string data
	decompressString: (compressedData: string): string => {
		try {
			let decompressed = "";
			let i = 0;

			while (i < compressedData.length) {
				let count = "";
				while (i < compressedData.length && /\d/.test(compressedData[i])) {
					count += compressedData[i];
					i++;
				}

				if (i < compressedData.length) {
					const char = compressedData[i];
					decompressed += char.repeat(parseInt(count));
					i++;
				}
			}

			return decompressed;
		} catch (error) {
			console.error("String decompression failed:", error);
			return compressedData;
		}
	},

	// Compress array data
	compressArray: <T>(data: T[]): string => {
		try {
			const jsonString = JSON.stringify(data);
			return DataCompression.compressString(jsonString);
		} catch (error) {
			console.error("Array compression failed:", error);
			return JSON.stringify(data);
		}
	},

	// Decompress array data
	decompressArray: <T>(compressedData: string): T[] => {
		try {
			const jsonString = DataCompression.decompressString(compressedData);
			return JSON.parse(jsonString);
		} catch (error) {
			console.error("Array decompression failed:", error);
			return JSON.parse(compressedData);
		}
	},
};

// Image compression utilities
export const ImageCompression = {
	// Compress image data
	compressImage: (
		imageData: string,
		quality: number = 0.8
	): Promise<string> => {
		return new Promise((resolve, reject) => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");

					if (!ctx) {
						reject(new Error("Canvas context not available"));
						return;
					}

					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);

					const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
					resolve(compressedDataUrl);
				};

				img.onerror = () => {
					reject(new Error("Image loading failed"));
				};

				img.src = imageData;
			} catch (error) {
				reject(error);
			}
		});
	},

	// Resize image
	resizeImage: (
		imageData: string,
		maxWidth: number,
		maxHeight: number
	): Promise<string> => {
		return new Promise((resolve, reject) => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");

					if (!ctx) {
						reject(new Error("Canvas context not available"));
						return;
					}

					let { width, height } = img;

					// Calculate new dimensions
					if (width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}

					if (height > maxHeight) {
						width = (width * maxHeight) / height;
						height = maxHeight;
					}

					canvas.width = width;
					canvas.height = height;
					ctx.drawImage(img, 0, 0, width, height);

					const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
					resolve(resizedDataUrl);
				};

				img.onerror = () => {
					reject(new Error("Image loading failed"));
				};

				img.src = imageData;
			} catch (error) {
				reject(error);
			}
		});
	},

	// Convert image to WebP
	convertToWebP: (imageData: string): Promise<string> => {
		return new Promise((resolve, reject) => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");

					if (!ctx) {
						reject(new Error("Canvas context not available"));
						return;
					}

					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);

					const webpDataUrl = canvas.toDataURL("image/webp", 0.8);
					resolve(webpDataUrl);
				};

				img.onerror = () => {
					reject(new Error("Image loading failed"));
				};

				img.src = imageData;
			} catch (error) {
				reject(error);
			}
		});
	},
};

// Storage compression utilities
export const StorageCompression = {
	// Compress localStorage data
	compressLocalStorage: (key: string, data: any): void => {
		try {
			const compressedData = DataCompression.compressJSON(data);
			localStorage.setItem(key, compressedData);
		} catch (error) {
			console.error("LocalStorage compression failed:", error);
			localStorage.setItem(key, JSON.stringify(data));
		}
	},

	// Decompress localStorage data
	decompressLocalStorage: (key: string): any => {
		try {
			const compressedData = localStorage.getItem(key);
			if (!compressedData) return null;

			return DataCompression.decompressJSON(compressedData);
		} catch (error) {
			console.error("LocalStorage decompression failed:", error);
			const data = localStorage.getItem(key);
			return data ? JSON.parse(data) : null;
		}
	},

	// Compress sessionStorage data
	compressSessionStorage: (key: string, data: any): void => {
		try {
			const compressedData = DataCompression.compressJSON(data);
			sessionStorage.setItem(key, compressedData);
		} catch (error) {
			console.error("SessionStorage compression failed:", error);
			sessionStorage.setItem(key, JSON.stringify(data));
		}
	},

	// Decompress sessionStorage data
	decompressSessionStorage: (key: string): any => {
		try {
			const compressedData = sessionStorage.getItem(key);
			if (!compressedData) return null;

			return DataCompression.decompressJSON(compressedData);
		} catch (error) {
			console.error("SessionStorage decompression failed:", error);
			const data = sessionStorage.getItem(key);
			return data ? JSON.parse(data) : null;
		}
	},
};

// Network compression utilities
export const NetworkCompression = {
	// Compress request data
	compressRequest: (data: any): string => {
		try {
			return DataCompression.compressJSON(data);
		} catch (error) {
			console.error("Request compression failed:", error);
			return JSON.stringify(data);
		}
	},

	// Decompress response data
	decompressResponse: (compressedData: string): any => {
		try {
			return DataCompression.decompressJSON(compressedData);
		} catch (error) {
			console.error("Response decompression failed:", error);
			return JSON.parse(compressedData);
		}
	},

	// Compress fetch request
	compressFetch: async (
		url: string,
		data: any,
		options: RequestInit = {}
	): Promise<Response> => {
		try {
			const compressedData = NetworkCompression.compressRequest(data);

			const response = await fetch(url, {
				...options,
				method: options.method || "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Encoding": "compressed",
					...options.headers,
				},
				body: compressedData,
			});

			return response;
		} catch (error) {
			console.error("Compressed fetch failed:", error);
			return fetch(url, {
				...options,
				method: options.method || "POST",
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
				body: JSON.stringify(data),
			});
		}
	},

	// Decompress fetch response
	decompressFetchResponse: async (response: Response): Promise<any> => {
		try {
			const compressedData = await response.text();

			if (response.headers.get("Content-Encoding") === "compressed") {
				return NetworkCompression.decompressResponse(compressedData);
			}

			return JSON.parse(compressedData);
		} catch (error) {
			console.error("Response decompression failed:", error);
			return response.json();
		}
	},
};

// Cache compression utilities
export const CacheCompression = {
	// Compress cache data
	compressCache: (key: string, data: any, cache: Map<string, any>): void => {
		try {
			const compressedData = DataCompression.compressJSON(data);
			cache.set(key, compressedData);
		} catch (error) {
			console.error("Cache compression failed:", error);
			cache.set(key, data);
		}
	},

	// Decompress cache data
	decompressCache: (key: string, cache: Map<string, any>): any => {
		try {
			const compressedData = cache.get(key);
			if (!compressedData) return null;

			return DataCompression.decompressJSON(compressedData);
		} catch (error) {
			console.error("Cache decompression failed:", error);
			return cache.get(key);
		}
	},

	// Compress memory cache
	compressMemoryCache: (key: string, data: any): void => {
		try {
			const compressedData = DataCompression.compressJSON(data);
			sessionStorage.setItem(`cache_${key}`, compressedData);
		} catch (error) {
			console.error("Memory cache compression failed:", error);
			sessionStorage.setItem(`cache_${key}`, JSON.stringify(data));
		}
	},

	// Decompress memory cache
	decompressMemoryCache: (key: string): any => {
		try {
			const compressedData = sessionStorage.getItem(`cache_${key}`);
			if (!compressedData) return null;

			return DataCompression.decompressJSON(compressedData);
		} catch (error) {
			console.error("Memory cache decompression failed:", error);
			const data = sessionStorage.getItem(`cache_${key}`);
			return data ? JSON.parse(data) : null;
		}
	},
};

// Performance monitoring for compression
export const CompressionMonitoring = {
	// Monitor compression ratio
	monitorCompressionRatio: (
		originalSize: number,
		compressedSize: number
	): number => {
		const ratio = (compressedSize / originalSize) * 100;
		console.log(`Compression ratio: ${ratio.toFixed(2)}%`);
		return ratio;
	},

	// Monitor compression time
	monitorCompressionTime: <T extends (...args: any[]) => any>(
		fn: T,
		name: string
	): T => {
		return ((...args: any[]) => {
			const startTime = performance.now();
			const result = fn(...args);
			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(`Compression ${name} time: ${duration.toFixed(2)}ms`);

			return result;
		}) as T;
	},

	// Monitor decompression time
	monitorDecompressionTime: <T extends (...args: any[]) => any>(
		fn: T,
		name: string
	): T => {
		return ((...args: any[]) => {
			const startTime = performance.now();
			const result = fn(...args);
			const endTime = performance.now();
			const duration = endTime - startTime;

			console.log(`Decompression ${name} time: ${duration.toFixed(2)}ms`);

			return result;
		}) as T;
	},
};

// Compression utilities for React components
export const ReactCompression = {
	// Compress component props
	compressProps: <P extends object>(props: P): string => {
		return DataCompression.compressJSON(props);
	},

	// Decompress component props
	decompressProps: <P extends object>(compressedProps: string): P => {
		return DataCompression.decompressJSON(compressedProps);
	},

	// Compress component state
	compressState: <S>(state: S): string => {
		return DataCompression.compressJSON(state);
	},

	// Decompress component state
	decompressState: <S>(compressedState: string): S => {
		return DataCompression.decompressJSON(compressedState);
	},

	// Compress component context
	compressContext: <T>(context: T): string => {
		return DataCompression.compressJSON(context);
	},

	// Decompress component context
	decompressContext: <T>(compressedContext: string): T => {
		return DataCompression.decompressJSON(compressedContext);
	},
};
