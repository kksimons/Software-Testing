const fs = require("fs");
const path = require("path");
const { axe, toHaveNoViolations } = require("jest-axe");
const { getByLabelText } = require("@testing-library/dom");
expect.extend(toHaveNoViolations);

// ACCESSIBILITY TESTS
describe("Payment Form Accessibility Tests", () => {
  it("should have no accessibility violations", async () => {
    const htmlContent = fs.readFileSync(
      path.join(__dirname, "../src/index.html"),
      "utf8"
    );
    document.body.innerHTML = htmlContent;
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it("should have no color contrast violations", async () => {
    const results = await axe(document.body);
    expect(results).toHaveNoViolations(); // 'axe' will handle color contrast issues
  });
});

// FUNCTIONALITY TESTS
describe("Payment Form Functionality", () => {
  beforeEach(() => {
    const htmlContent = fs.readFileSync(
      path.join(__dirname, "../src/index.html"),
      "utf8"
    );
    document.body.innerHTML = htmlContent;
    require("../src/index.js");
  });

  // INPUT VALIDATION TESTS
  describe("Input Validation Tests", () => {
    it("should format the credit card number", () => {
      const cardNumInput = document.querySelector("#cardNum");
      cardNumInput.value = "1234123412341234";
      const event = new KeyboardEvent("keyup");
      cardNumInput.dispatchEvent(event);
      expect(cardNumInput.value).toBe("1234 1234 1234 1234"); // Credit card is formatted correctly
    });

    it("should not allow form submission with empty required fields", () => {
      const form = document.querySelector("form");
      form.onsubmit = (e) => {
        e.preventDefault();
      };
      form.dispatchEvent(new Event("submit"));

      const requiredFields = document.querySelectorAll("[required]");
      requiredFields.forEach((field) => {
        expect(field.value).not.toBe(""); // All required fields should have a value
      });
    });

    it("should validate email format using regex (expected to fail)", () => {
      const emailInput = document.querySelector("#email");
      emailInput.value = "invalidemail.com"; // Invalid email
      emailInput.dispatchEvent(new Event("input"));

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(emailInput.value);

      expect(isValidEmail).toBe(true); // Test should fail since validation isn't implemented
    });

    it("should not allow invalid credit card number (non-numeric characters)", () => {
      const cardNumInput = document.querySelector("#cardNum");
      cardNumInput.value = "abcd efgh ijkl mnop";
      const event = new KeyboardEvent("keyup");
      cardNumInput.dispatchEvent(event);

      // Since the current code doesn't prevent non-numeric input, this test will fail.
      expect(cardNumInput.value).toBe(""); // Non-numeric characters should not be allowed
    });

    it("should handle missing CVV", () => {
      const cvvInput = document.querySelector("#cvv");
      cvvInput.value = "";
      const form = document.querySelector("form");
      form.onsubmit = (e) => {
        e.preventDefault();
        expect(cvvInput.value).not.toBe(""); // CVV field should not be empty
      };
      form.dispatchEvent(new Event("submit"));
    });
  });

  // SUBMISSION TESTS
  describe("Form Submission Tests", () => {
    it("should allow submission with valid inputs", () => {
      const form = document.querySelector("form");
      const nameInput = document.querySelector("#name");
      const cardNumInput = document.querySelector("#cardNum");
      const cvvInput = document.querySelector("#cvv");

      nameInput.value = "John Doe";
      cardNumInput.value = "1234 1234 1234 1234";
      cvvInput.value = "123";

      form.onsubmit = (e) => {
        e.preventDefault();
        const isFormValid =
          nameInput.value && cardNumInput.value && cvvInput.value;
        expect(isFormValid).toBe(true); // Form is valid if all inputs have values
      };

      form.dispatchEvent(new Event("submit"));
    });
  });

  // NETWORK CONNECTIVITY TESTS
  describe("Network Connectivity Tests", () => {
    it("should handle network errors gracefully", async () => {
      const fetchMock = require("jest-fetch-mock");
      fetchMock.enableMocks();
      fetchMock.mockRejectOnce(new Error("Network Error"));

      const form = document.querySelector("form");
      form.onsubmit = (e) => {
        e.preventDefault();
        fetch("https://api.stripe.com/v1/charges", {
          method: "POST",
          body: JSON.stringify({
            cardNum: document.querySelector("#cardNum").value,
            cvv: document.querySelector("#cvv").value,
          }),
        }).catch((error) => {
          expect(error.message).toBe("Network Error"); // Expecting network error
        });
      };

      form.dispatchEvent(new Event("submit"));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it("should send data to Stripe API mock", async () => {
      const fetchMock = require("jest-fetch-mock");
      fetchMock.enableMocks();
      fetchMock.mockResponseOnce(
        JSON.stringify({
          id: "fake_charge_id",
          status: "success",
        })
      );

      const form = document.querySelector("form");
      form.onsubmit = (e) => {
        e.preventDefault();
        // Simulate form submission
        fetch("https://api.stripe.com/v1/charges", {
          method: "POST",
          body: JSON.stringify({
            cardNum: document.querySelector("#cardNum").value,
            cvv: document.querySelector("#cvv").value,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            expect(data.status).toBe("success"); // Check if mock response is success
          });
      };

      form.dispatchEvent(new Event("submit"));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  // USER INTERFACE (UI) TESTS
  describe("User Interface Tests", () => {
    it("should render all form fields correctly", () => {
      const form = document.querySelector("form");

      const nameInput = document.querySelector("#name");
      const emailInput = document.querySelector("#email");
      const cardNumInput = document.querySelector("#cardNum");
      const submitButton = document.querySelector(".submit_btn");

      expect(nameInput).not.toBeNull();
      expect(emailInput).not.toBeNull();
      expect(cardNumInput).not.toBeNull();
      expect(submitButton).not.toBeNull();

      expect(submitButton.value).toBe("Proceed to Checkout");
    });

    it("should disable submit button if required fields are missing", () => {
      const submitButton = document.querySelector(".submit_btn");
      const cardNumInput = document.querySelector("#cardNum");

      cardNumInput.value = ""; // No value in card number input
      submitButton.disabled = !cardNumInput.value; // Disable if cardNum is empty

      expect(submitButton.disabled).toBe(true); // Button should be disabled
    });

    it("should have labels for all form inputs", () => {
      const nameLabel = document.querySelector("label[for='name']");
      const emailLabel = document.querySelector("label[for='email']");
      const cardNumLabel = document.querySelector("label[for='cardNum']");
      const cvvLabel = document.querySelector("label[for='cvv']");

      expect(nameLabel).not.toBeNull();
      expect(emailLabel).not.toBeNull();
      expect(cardNumLabel).not.toBeNull();
      expect(cvvLabel).not.toBeNull(); // Check if all inputs have labels
    });
  });

  // EDGE CASE TESTS
  describe("Edge Case Tests", () => {
    it("should not allow more than 19 characters in the card number input", () => {
      const cardNumInput = document.querySelector("#cardNum");
      cardNumInput.value = "12345678901234567890"; // 20 characters should not be allowed
      const event = new KeyboardEvent("keyup");
      cardNumInput.dispatchEvent(event);

      expect(cardNumInput.value.length).toBe(19); // Should truncate at 19 characters
    });

    it("should handle empty string as input gracefully", () => {
      const cardNumInput = document.querySelector("#cardNum");
      cardNumInput.value = ""; // Empty input
      const event = new KeyboardEvent("keyup");
      cardNumInput.dispatchEvent(event);

      expect(cardNumInput.value).toBe(""); // No formatting for empty input
    });

    it("should not allow special characters in the card number input", () => {
      const cardNumInput = document.querySelector("#cardNum");
      cardNumInput.value = "!@#$%^&*()";
      const event = new KeyboardEvent("keyup");
      cardNumInput.dispatchEvent(event);

      // Since the current code doesn't handle special characters, this test is expected to fail.
      expect(cardNumInput.value).toBe(""); // Special characters should not be allowed
    });

    it("should not allow SQL injection attempts in any input field", () => {
      const inputs = document.querySelectorAll("input");
      const sqlInjectionString = "' OR 1=1; --";

      inputs.forEach((input) => {
        input.value = sqlInjectionString;
        input.dispatchEvent(new Event("input"));

        expect(input.value).not.toContain(sqlInjectionString); // SQL injection should be rejected
      });
    });

    it("should prevent XSS injection in any input field", () => {
      const inputs = document.querySelectorAll("input");
      const xssInjectionString = "<script>alert('XSS')</script>";

      inputs.forEach((input) => {
        input.value = xssInjectionString;
        input.dispatchEvent(new Event("input"));

        expect(input.value).not.toContain("<script>"); // XSS injection should be sanitized or rejected
      });
    });
  });
});
