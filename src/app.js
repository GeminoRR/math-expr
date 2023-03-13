//Variables
const inputExpression = document.getElementById('inputExpression');
const convertButton = document.getElementById('convertButton')
const input_loading = document.getElementById('input_loading');
const result = document.getElementById('result');
const result_panel = document.getElementById('result_panel');
const content = document.getElementById('content');
const copy_result = document.getElementById('copy_result');
const clone_result = document.getElementById('clone_result');
const notification_container = document.getElementById('notification_container');
const notification_content = document.getElementById('notification_content');
const open_result = document.getElementById('open_result');

//Copy Exemple <p>
const exemples = document.getElementsByClassName('help-container-left');
for (let i = 0; i < exemples.length; i++){
    let exemple = exemples[i].children[1];
    exemple.onclick = ()=>{
        navigator.clipboard.writeText(exemple.textContent);
        showNotification("Expression copier" + exemple.textContent);
    }
};

//Close result
clone_result.addEventListener('click', ()=>{
    result_panel.classList.remove('result-panel-showed');
});

//Show notification
function showNotification(message, duration = 4000){

    //Change message
    notification_content.textContent = message;

    //Show notification
    if (!(notification_container.classList.contains("notification-showed"))){
        notification_container.classList.add('notification-showed');
        setTimeout(()=>{
            notification_container.classList.remove('notification-showed');
        }, duration);
    }


}

//On scroll
window.addEventListener("scroll", ()=>{
	content.classList.toggle("content-minimized", window.scrollY > 30);
});

//Copy result
copy_result.addEventListener('click', ()=>{
    navigator.clipboard.writeText(result.getAttribute('expression'))
    .then(() => {
        showNotification("Expression laTeX copier dans le presse papier !", 4000);
    })
    .catch(err => {
        showNotification(err, 4000);
    });
});

//Open Result
open_result.addEventListener('click', ()=>{
    window.open(result.src);
});

//Input press enter
inputExpression.addEventListener('keypress', (e)=>{
    if (e.key == "Enter"){
        convertButton.click();
    }
});

//Onload
result.onload = ()=>{

    //Show
    result_panel.classList.add('result-panel-showed');

    //Stop loading
    input_loading.hidden = true;
    input_loading.classList.remove('input-loading-anim');
    convertButton.hidden = false;

};

//Converter
convertButton.addEventListener('click', ()=>{

    //Empty
    if (inputExpression.value == ""){
        result_panel.classList.remove('result-panel-showed');
        return;
    }

    //Show loading
    input_loading.hidden = false;
    input_loading.classList.add('input-loading-anim');
    convertButton.hidden = true;

    //Hide result
    result_panel.classList.remove('result-panel-showed');

    //Try
    try {
     
        //Lexer (text -> token[])
        let tokens = text_to_token(inputExpression.value);

        //Parse (token[] -> node)
        let root = tokens_to_node(tokens);

        //Convert (node -> latex expression)
        let converted = node_to_latex(root);

        //Load image
        result.src = 'https://latex.codecogs.com/svg.image?' + converted;
        result.setAttribute('expression', converted);

    } catch (error) {

        //Stop loading animation
        input_loading.hidden = true;
        input_loading.classList.remove('input-loading-anim');
        convertButton.hidden = false;
        
        //Error animation
        inputExpression.classList.add('input-error');
        setTimeout(()=>{
            inputExpression.classList.remove('input-error');
        }, 3000);

    }

});

//Error
function pushError(title, message) {
    showNotification(title.toUpperCase() + ": " + message);
    throw new Error(title.toUpperCase() + ": " + message);
}

//Token convert
function text_to_token(text) {

    //Variables
    let tokens = []
    let alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let numbers = "0123456789";
    let i = 0

    //Start token process
    while (i < text.length){

        //Letter
        if (alphabet.includes(text[i])){
            let result = '';
            while (alphabet.includes(text[i])){
                result += text[i];
                i += 1;
            }
            tokens.push({ type: "letter", value: result });
            continue;
        }

        //Number
        if (numbers.includes(text[i])){
            let number = '';
            let dot_count = 0;
            while ((numbers + ".").includes(text[i])){
                if (text[i] == "."){
                    dot_count += 1;
                    if (dot_count > 1){
                        break;
                    }
                    number += ".";
                } else {
                    number += text[i];
                }
                i += 1;
            };
            /*if (dot_count == 0)
                tokens.push({ type:"int", value:parseInt(number) });
            else
                tokens.push({ type:"float", value:parseFloat(number) });*/
            tokens.push({ type:"number", value:number });
            continue;
        }

        //Space
        if (text[i] == " "){
            i += 1;
            continue;
        }

        //Tiret du huit (_)
        if (text[i] == "_"){
            i += 1;
            tokens.push({ type:"_" });
            continue;
        }

        //Chapeau (^)
        if (text[i] == "^"){
            i += 1;
            tokens.push({ type:"^" });
            continue;
        }

        //Addition (+)
        if (text[i] == "+"){
            i += 1;
            tokens.push({ type:"+" });
            continue;
        }

        //Soustraction (-)
        if (text[i] == "-"){
            i += 1;
            tokens.push({ type:"-" });
            continue;
        }

        //Multiplication (*)
        if (text[i] == "*"){
            i += 1;
            tokens.push({ type:"*" });
            continue;
        }

        //Divison (/)
        if (text[i] == "/"){
            i += 1;
            tokens.push({ type:"/" });
            continue;
        }

        //Left (()
        if (text[i] == "("){
            i += 1;
            tokens.push({ type:"(" });
            continue;
        }

        //Right ())
        if (text[i] == ")"){
            i += 1;
            tokens.push({ type:")" });
            continue;
        }

        //Tiret du huit (=)
        if (text[i] == "="){
            i += 1;
            tokens.push({ type:"=" });
            continue;
        }

        //Special ($)
        if (text[i] == "$"){
            i += 1;
            tokens.push({ type:"$" });
            continue;
        }

        //Unknown
        pushError("Unknown character", "This character is unknown : \"" + text[i] + "\"");
        return;

    }

    //Return
    return tokens;

}

//Node convert
function tokens_to_node(tokens) {
    
    //No tokens
    if (tokens.length == 0)
        return null;

    //Variables
    let current_tok_idx = 0;
    let current_tok = tokens[0];

    //Advance
    function advance() {
        current_tok_idx += 1;
        // if (!(current_tok_idx < tokens.length)){
        //     pushError("Missing token", "A part of the expression is missing. Please continue.");
        // }
        if (current_tok_idx < tokens.length)
            current_tok = tokens[current_tok_idx];
        else
            current_tok = { type:"", value:"" }
    }

    //Factor ( Valeur | Lettres )
    function factor(notPushError = false){

        //Number
        if (current_tok.type == "number"){
            let value = current_tok.value;
            advance();
            return { type:"number", value:value };
        }

        //Spécial
        if (current_tok.type == "$"){
            advance();
            if (current_tok.type != "letter"){
                pushError("Syntax error", "No letter after \"$\"!")
                return;
            }
            let value = current_tok.value.toLowerCase();
            advance();
            return { type:"special", value:value };
        }

        //Letter
        if (current_tok.type == "letter"){
            let value = current_tok.value;
            advance();
            return { type:"letter", value:value };
        }

        //Parenthèse
        if (current_tok.type == "("){
            advance();
            let value = top();
            if (!(current_tok.type == ")"))
                pushError("Missing token", "The \")\" character is missing")
            advance();
            return value;
        }

        //Missing
        if (notPushError)
            return { type:"", value:"" }
        else
            pushError("Parser error", "Something is missing...");

    }

    //Functions
    function fun(notPushError = false){

        let left = factor(notPushError)
        if (left.type == "letter" && current_tok.type == "("){
            advance();
            let arguments = [];
            while (current_tok.type != ")"){
                arguments.push(top());
            }
            left = { type:"function", name:left.value, arguments:arguments };
            advance();
        }
        return left;

    }

    //Power (^)
    function power(notPushError = false){

        let left = fun(notPushError);
        if (current_tok.type == "^"){
            advance();
            let right = fun(notPushError);
            left = { type:"^", left:left, right:right }
        }
        return left;

    }

    //Undercase (_)
    function undercase(notPushError = false){

        let left = power(notPushError);
        if (current_tok.type == "_"){
            advance();
            let right = power(notPushError);
            left = { type:"_", left:left, right:right }
        }
        return left;

    }

    //Word
    function word(){

        let left = undercase();
        while (true){
            let pastIndex = current_tok_idx
            let right = undercase(true);
            if (right.type == ""){
                current_tok_idx = pastIndex
                break;
            } else {
                left = { type:"word", left:left, right:right }
            }
        }
        return left;

    }

    //One operator
    function oneOperator(){

        if (current_tok.type == "-"){
            advance();
            let value = word();
            return { type:"oo-", value:value };
        }

        return word();

    }


    //Division
    function div(){

        let left = oneOperator();
        while (current_tok.type == "/"){
            advance()
            let right = oneOperator()
            left = { type:"div", left:left, right:right }
        }
        return left;

    }

    //Multiplication
    function mult(){

        let left = div();
        while (current_tok.type == "*"){
            advance()
            let right = div()
            left = { type:"mult", left:left, right:right }
        }
        return left;

    }

    //Comb ( Addition | Soustraction )
    function comb(){

        let left = mult();
        while (["+", "-"].includes(current_tok.type)){
            let op = current_tok.type;
            advance()
            let right = mult()
            left = { type:"comb", left:left, right:right, op:op }
        }
        return left;

    }
    
    //Equality
    function equality(){

        let left = comb();
        while (current_tok.type == "="){
            advance();
            let right = comb();
            left = { type:"equality", left:left, right:right };
        }
        return left;

    }

    //Top
    function top(){
        return equality();
    }

    //Parse
    return top()

}

//Node to laTeX Math
function node_to_latex(root){

    //Node need paranthèses
    function nodeNeedParentheses(node){
        if (node.type == "word")
            if ("0123456789".includes(compileWord(node).slice(-1)))
                return true;
        return ["comb", "mult", "oo-"].includes(node.type);            
    }

    //Compile number
    function compileNumber(node){
        return node.value;
    }

    //Compile letter
    function compileLetter(node){
        return node.value;
    }

    //Compile word
    function compileWord(node){
        if (node.left.type == "number" && node.right.type == "number")
            return "(" + compileNode(node.left) + ")(" + compileNode(node.right) + ")";
        let left = compileNode(node.left)
        if (nodeNeedParentheses(node.left))
            left = "(" + left + ")"
        let right = compileNode(node.right)
        if (nodeNeedParentheses(node.right))
            right = "(" + right + ")"
        return left + right;
    }

    //Compile ^
    function compilePower(node){
        return compileNode(node.left) + "^{" + compileNode(node.right) + "}"
    }

    //Compile _
    function compileUndercase(node){
        return compileNode(node.left) + "_{" + compileNode(node.right) + "}"
    }

    //Compile mult
    function compileMult(node){
        return compileNode(node.left) + " \\times " + compileNode(node.right) + "";
    }

    //Compile div
    function compileDiv(node){
        return "\\frac{" + compileNode(node.left) + "}{" + compileNode(node.right) + "}";
    }

    //Compile comb
    function compileComb(node){
        if (node.op == "+")
            return compileNode(node.left) + " + " + compileNode(node.right) + "";
        else if (node.op == "-")
            return compileNode(node.left) + " - " + compileNode(node.right) + "";
        else
            pushError("Unknown operator", "Cannot compile expression with \"" + node.op + "\" operator.");
    }

    //Compile equality
    function compileEquality(node){
        return compileNode(node.left) + " = " + compileNode(node.right);
    }

    //Compile function
    function compileFunction(node){

        //Sqrt
        if (node.name == "sqrt" && node.arguments.length == 1)
            return "\\sqrt{" + compileNode(node.arguments[0]) + "}";

        //For all
        let result = node.name + "(";
        node.arguments.forEach(arg=>{
            result += compileNode(arg);
        });
        return result + ")";

    }

    //Compile special
    function compileSpecial(node){

        //Delta
        if (node.value == "delta")
            return "\\Delta";

        //Lambda
        if (node.value == "lambda")
            return "\\lambda";

        //Gamma
        if (node.value == "gamma")
            return "\\Gamma";

        //Unknown
        pushError("Syntax error", "unknown character : $" + node.value);
        return "";

    }

    //Compile one operator (minus)
    function compileOominus(node){
        if (nodeNeedParentheses(node.value))
            return "-(" + compileNode(node.value) + ")";
        else
            return "-" + compileNode(node.value);
    }
    
    //Compile node
    function compileNode(node){
        if (node.type == "number")
            return compileNumber(node);
        if (node.type == "letter")
            return compileLetter(node);
        if (node.type == "word")
            return compileWord(node);
        if (node.type == "^")
            return compilePower(node);
        if (node.type == "_")
            return compileUndercase(node);
        if (node.type == "comb")
            return compileComb(node);
        if (node.type == "mult")
            return compileMult(node);
        if (node.type == "div")
            return compileDiv(node);
        if (node.type == "equality")
            return compileEquality(node);
        if (node.type == "function")
            return compileFunction(node);
        if (node.type == "special")
            return compileSpecial(node);
        if (node.type == "oo-")
            return compileOominus(node);
    }

    //Compile
    return compileNode(root);

}