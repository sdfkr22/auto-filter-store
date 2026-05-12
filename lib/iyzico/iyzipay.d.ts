declare module "iyzipay" {
  type Cb<T = unknown> = (err: unknown, result: T) => void;

  interface IyzipayOptions {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  class Iyzipay {
    constructor(opts: IyzipayOptions);
    checkoutFormInitialize: { create<T = unknown>(request: unknown, cb: Cb<T>): void };
    checkoutForm: { retrieve<T = unknown>(request: unknown, cb: Cb<T>): void };
    installmentInfo: { retrieve<T = unknown>(request: unknown, cb: Cb<T>): void };
    refund: { create<T = unknown>(request: unknown, cb: Cb<T>): void };
    cancel: { create<T = unknown>(request: unknown, cb: Cb<T>): void };

    static LOCALE: { TR: "tr"; EN: "en" };
    static CURRENCY: { TRY: "TRY"; EUR: "EUR"; USD: "USD"; GBP: "GBP" };
    static PAYMENT_GROUP: { PRODUCT: "PRODUCT"; LISTING: "LISTING"; SUBSCRIPTION: "SUBSCRIPTION" };
    static BASKET_ITEM_TYPE: { PHYSICAL: "PHYSICAL"; VIRTUAL: "VIRTUAL" };
  }

  export default Iyzipay;
}
