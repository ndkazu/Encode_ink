#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod greeter {
    use ink::prelude::string::String;
    use ink::prelude::{vec, vec::Vec};

    #[ink(event)]
    pub struct Greeted {
        from: Option<AccountId>,
        message: String,
    }

    #[ink(storage)]
    pub struct Greeter {
        message: Vec<String>,
    }

    impl Greeter {
        /// Creates a new greeter contract containing the given value.
        #[ink(constructor)]
        pub fn new(init_value: String) -> Self {
            let mut mess = vec![];
            mess.push(init_value);
            Self { message: mess }
        }

        /// Creates a new greeter contract containing 'Hello ink!'.
        #[ink(constructor)]
        pub fn default() -> Self {
            let default_message = String::from("Hello ink!");
            Self::new(default_message)
        }

        /// Returns the current list of `message`.
        #[ink(message)]
        pub fn greet(&self, ind: u32) -> String {
            self.message.clone()[ind as usize].clone()
        }

        #[ink(message)]
        pub fn index(&self, coef: u32) -> u32 {
            let vec = self.message.clone();
            let num = coef % vec.len() as u32;
            num
        }

        /// Add the given value to `message` .
        #[ink(message)]
        pub fn set_message(&mut self, new_value: String) {
            self.message.push(new_value.clone());

            let from = self.env().caller();
            self.env().emit_event(Greeted {
                from: Some(from),
                message: new_value,
            });
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let message = "Hello ink! v4".to_string();
            let greeter = Greeter::new(message.clone());
            assert_eq!(greeter.greet(0), message);
        }

        #[ink::test]
        fn default_new_works() {
            let greeter = Greeter::default();
            let default_message = String::from("Hello ink!");
            assert_eq!(greeter.greet(0), default_message);
        }

        #[ink::test]
        fn set_message_works() {
            let message_1 = String::from("gm ink!");
            let mut greeter = Greeter::new(message_1.clone());
            assert_eq!(greeter.greet(0), message_1);
            let message_2 = String::from("gn");
            greeter.set_message(message_2.clone());
            assert_eq!(greeter.greet(1), message_2);
        }
    }
}
