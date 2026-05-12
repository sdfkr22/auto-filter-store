import Iyzipay from "iyzipay";

// Iyzipay CommonJS callback API'sini Promise sarmalayıcılarla kullanıyoruz.
// Lazy init — env'i ilk çağrıda okur (test/import sırasında hata vermesin).

let cached: Iyzipay | null = null;

function getClient(): Iyzipay {
  if (!cached) {
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;
    const uri = process.env.IYZICO_BASE_URL || "https://sandbox.iyzipay.com";
    if (!apiKey || !secretKey) {
      throw new Error("IYZICO_API_KEY ve IYZICO_SECRET_KEY .env.local içinde tanımlı olmalı");
    }
    cached = new Iyzipay({ apiKey, secretKey, uri });
  }
  return cached;
}

function promisify<T>(fn: (cb: (err: unknown, result: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => (err ? reject(err) : resolve(result)));
  });
}

// ---------------------------------------------------------------------------
// Checkout Form Initialize — ödeme sayfası iframe URL'si üretir.
// Başarılı çağrıda result.paymentPageUrl + result.token döner.
// ---------------------------------------------------------------------------
export type CheckoutInitRequest = {
  locale: "tr" | "en";
  conversationId: string;
  price: string;                 // "100.50" — ürün toplamı (kargosuz)
  paidPrice: string;             // "110.50" — müşterinin ödediği son tutar
  currency: "TRY";
  basketId: string;              // bizim order_no
  paymentGroup: "PRODUCT";
  callbackUrl: string;           // POST callback — bizim /api/iyzico/callback
  enabledInstallments?: number[];
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;           // "+905..."
    email: string;
    identityNumber: string;      // TC — yoksa "11111111111"
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;             // "Turkey"
    zipCode?: string;
  };
  shippingAddress: AddressBlock;
  billingAddress: AddressBlock;
  basketItems: BasketItem[];
};

export type AddressBlock = {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode?: string;
};

export type BasketItem = {
  id: string;
  name: string;
  category1: string;
  itemType: "PHYSICAL";
  price: string;                 // tek birim * adet (string)
};

export type CheckoutInitResult = {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  paymentPageUrl?: string;
  token?: string;
  tokenExpireTime?: number;
  checkoutFormContent?: string;  // iframe HTML
  conversationId?: string;
};

export function createCheckoutForm(req: CheckoutInitRequest): Promise<CheckoutInitResult> {
  const client = getClient();
  return promisify<CheckoutInitResult>((cb) => client.checkoutFormInitialize.create(req, cb));
}

// ---------------------------------------------------------------------------
// Checkout Form Retrieve — callback sonrası token ile ödeme detayını al.
// ---------------------------------------------------------------------------
export type CheckoutRetrieveResult = {
  status: "success" | "failure";
  paymentStatus?: "SUCCESS" | "FAILURE" | "INIT_THREEDS" | "CALLBACK_THREEDS" | "BANK_FRAUD_CHECK";
  errorCode?: string;
  errorMessage?: string;
  paymentId?: string;
  conversationId?: string;
  basketId?: string;
  price?: number;
  paidPrice?: number;
  currency?: string;
  installment?: number;
  cardType?: string;
  cardAssociation?: string;
  cardFamily?: string;
  cardToken?: string;
  cardUserKey?: string;
  binNumber?: string;
  lastFourDigits?: string;
  fraudStatus?: number;
};

export function retrieveCheckoutForm(token: string): Promise<CheckoutRetrieveResult> {
  const client = getClient();
  return promisify<CheckoutRetrieveResult>((cb) =>
    client.checkoutForm.retrieve({ locale: "tr", token }, cb)
  );
}

// ---------------------------------------------------------------------------
// Installment Info — kart BIN'ine göre taksit seçeneklerini getir.
// ---------------------------------------------------------------------------
export type InstallmentResult = {
  status: "success" | "failure";
  installmentDetails?: Array<{
    binNumber: string;
    bankName?: string;
    cardType?: string;
    cardAssociation?: string;
    cardFamilyName?: string;
    installmentPrices: Array<{
      installmentPrice: string;
      totalPrice: string;
      installmentNumber: number;
    }>;
  }>;
};

export function listInstallments(price: number, binNumber: string): Promise<InstallmentResult> {
  const client = getClient();
  return promisify<InstallmentResult>((cb) =>
    client.installmentInfo.retrieve(
      { locale: "tr", price: price.toFixed(2), binNumber },
      cb
    )
  );
}
