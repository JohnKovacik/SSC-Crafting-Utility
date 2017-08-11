var focusEvocationShowLevel;
var focusThaumaturgyShowLevel;
var charInfo = {};
var errList = [];
var itemDetails;

// To determine the chance, find the diff and add 4. 
// 0 = -4, 2 = -2, 4 = 0, 6 = 2...
var odds = [100, 99, 94, 82, 62, 38, 19, 6, 1, 0];

//1-2: A ring
//3-4: An orange/wand
//5-6: A grapefruit/rod
//7-8: A basketball/walking stick
//9-10+: A beachball/staff
var sizeText = ['A ring',
            'An orange/wand',
            'A grapefruit/rod',
            'A basketball/walking stick',
            'A beachball/staff'];

var sizeTextPotion = ['None',
            'Mild',
            'Moderate',
            'Strong',
            'Obvious'];

String.prototype.format = function () {
    var s = this, i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

$(function () {
    $('#btnToogleTooltips').click(btnToogleTooltips_click);

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        var target = $(e.target).attr("href") // activated tab
        if (target == '#itemEffects') { ddlItemType_change(); } // Show appropriate Item Effects
        validateData(target);
    });

    focusEvocationShowLevel = 0;
    focusThaumaturgyShowLevel = 0;
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="tooltip"]').tooltip('disable'); // Start disabled.

    $('[data-toggle="popover"]').popover();
    $('.popover-dismiss').popover({ trigger: 'focus' })

    $('#ctrl_ItemType').on('change', function () { ddlItemType_change(); });
    $('#btnResetEffects').click(btnResetEffects_click);

    $('#ctrl_MaxWealth').on('change', function () { ddlMaxWealth_change(); });
    ddlMaxWealth_change(); // Also invoke this on load to initialize the wealth stress boxes.

    $(".startHidden").hide();
    $("[id^='rowEvoc']").hide();
    $("[id^='rowThau']").hide();

    $("#btnAddEvocation").click(btnAddEvocation_click).removeAttr("disabled").removeProp("aria-disabled");
    $("#btnAddThaumaturgy").click(btnAddThaumaturgy_click).removeAttr("disabled").removeProp("aria-disabled");

    $("[id^='btnDelEvoc']").click(btnDelEvocation_click);
    $("[id^='btnDelThau']").click(btnDelThaumaturgy_click);

    $("#btnClearStress").click(btnClearStress_click);
    $("#btnSaveCharInfo").click(saveCharInfo);

    $("[id^='itemType']").hide();
    $("#rowItemType").hide();

})

// Clear all Item Effect controls.
function btnResetEffects_click() {
    // itemType_focus
    $('#itemType_focus select').val('');
    $("[id^='btnDelEvoc']").hide();
    $("[id^='rowEvoc']").hide();
    $("[id^='btnDelThau']").hide();
    $("[id^='rowThau']").hide();

    focusEvocationShowLevel = 0;
    focusThaumaturgyShowLevel = 0;
    setFocusAddButtonStates();

    // itemType_item
    $("#itemType_item [id^='ctrl_']").val('--');
    $("#itemType_item [id^='ctrl_']:text").val('');
    $("#ctrl_ItemUses").val('1');

    // itemType_potion
    $("#itemType_potion [id^='ctrl_Potion']").val('--');
    $("#itemType_potion [id^='ctrl_Potion']:text").val('');

    $("[id^='chkUndetectable']").prop('checked', false);
    $("[id^='chkUndetectable']").parent().removeClass('active').removeAttr('aria-pressed');

    $("#ctrl_PotionIsGas").val('No');
    $("#ctrl_PotionDoses").val('1');

    // Clear item type
    $('#ctrl_ItemType').val('');
    $("#itemEffects .startHidden").hide();
}

function btnToogleAlerts_click() {
    var ButtonText = $('#btnToogleAlerts').html();
    if (ButtonText == 'Disable Alerts') {
        feedbackEnabled = false;
        $('#btnToogleAlerts').html('Enable Alerts');
    }
    else {
        feedbackEnabled = true;
        $('#btnToogleAlerts').html('Disable Alerts');
    }
}

function btnToogleTooltips_click() {
    var ButtonText = $('#btnToogleTooltips').html();
    if (ButtonText == 'Disable Tooltips') {
        $('[data-toggle="tooltip"]').tooltip('disable');
        $('#btnToogleTooltips').html('Enable Tooltips');
    }
    else {
        $('[data-toggle="tooltip"]').tooltip('enable');
        $('#btnToogleTooltips').html('Disable Tooltips');
    }
}

function _addErrMsg(msg) {
    errList.push("<li class='list-group-item'>" + msg + "</li>");
}

function showErrorMessages(header) {
    //alert("caller is " + arguments.callee.caller.toString());
    $("#errModalLabel").text(header);
    $("#modalErrListDiv").empty();
    $("#modalErrListDiv").append("<ul class='list-group'>");
    $.each(errList, function (index, value) { $("#modalErrListDiv").append(value); });
    $("#modalErrListDiv").append("</ul>");
    $("#modErrMsg").modal();
}

function showItem() {
    $('#divModalItemName').html('<b>Name:</b> ' + itemDetails.name);
    $('#divModalItemOwner').html((itemDetails.owner == 'OPEN' ? '<b>(Open)</b>' : '<b>Keyed To:</b> ' + itemDetails.owner));
    $('#divModalItemDescription').html('<b>Description:</b> ' + itemDetails.desc);

    // Determine min size: use 1/2 effective power, rounded up, minus size specialization.
    var sizeIndex = Math.round(itemDetails.power / 2) - charInfo.spec_size - 1; // Base0 index
    if (sizeIndex < 0) { sizeIndex = 0; }
    if (sizeIndex > 4) { sizeIndex = 4; }

    var htmlEffects = '';
    var htmlSpecifications = '';

    // Show uses (we're doing this first, so we can also use item type for effects.
    switch (itemDetails.itemType) {
        case "":
            break;
        case "focus":
            $("#divModalItemUses").html('<b>Uses:</b> (Unlimited)');
            htmlEffects = '<b>Focus Item:</b> ';
            $('#divModalItemSize').html('<b>Min. Size:</b> ' + sizeText[sizeIndex]);
            break;
        case "item":
            $("#divModalItemUses").html('<b>Uses:</b> [&nbsp;&nbsp;] ' + Array(itemDetails.uses).join('[&nbsp;&nbsp;] ')); // Since join shows n-1 elements
            htmlEffects = '<b>Enchanted Item:</b> ';
            $('#divModalItemSize').html('<b>Min. Size:</b> ' + sizeText[sizeIndex]);
            break;
        case "potion":
            $("#divModalItemUses").html('<b>Doses:</b> [&nbsp;&nbsp;] ' + Array(itemDetails.uses).join('[&nbsp;&nbsp;] ')); // Since join shows n-1 elements
            htmlEffects = itemDetails.isGas ? '<b>Potion (Gas):</b> ' : '<b>Potion:</b> ';
            $('#divModalItemSize').html('<b>Noticeability:</b> ' + sizeTextPotion[sizeIndex]);
            break;
    }
    $("#divModalItemSlots").html('<b>Slots:</b> ' + itemDetails.slots);

    // Show item effects, plus full specification details
    // Create an array of format strings plus bonuses, to collapse the item description to a more readable format.
    var arreffects = new Array();
    var arrformat = {};
    var descFormat = "{0} [{1} Power, {2} Slots]";
    $.each(itemDetails.effects, function (ndx) {
        var eff = itemDetails.effects[ndx];
        arreffects.push(descFormat.format(eff.description, eff.power, eff.slots));

        // format & bonus - only add if there's something to show.
        if ($.trim(eff.format.format(eff.bonus)) != '') {
            if (typeof arrformat[eff.format] == "undefined" || isNaN(parseInt(eff.bonus))) {
                arrformat[eff.format] = eff.bonus;
            }
            else {
                arrformat[eff.format] += eff.bonus;
            }
        }
    });

    htmlSpecifications += arreffects.join('<br />');
    $('#divModalItemSpecs').html(htmlSpecifications);

    // Create nicely-formatted effects description
    var cleanHtml = new Array();
    for (key in arrformat) {
        var value = arrformat[key];
        cleanHtml.push(key.format(value));
    }

    if (cleanHtml.length == 0) {
        // No usable effects!
        _addErrMsg("This item has no usable effects defined.");
        $("#errModalLabel").text("Item Details Issue(s)");
        $("#itemEffectsTab").tab('show');
        showErrorMessages("No effects defined.");
        return;
    }

    $('#divModalItemDetails').html(htmlEffects + cleanHtml.join('; '));

    if (itemDetails.flawHtml != '') {
        $('#divModalItemFlaw').show();
        $('#divModalItemFlaw').html(itemDetails.flawHtml);
    }
    else {
        $('#divModalItemFlaw').hide();
    }

    // Show crafting details
    $('#divModalItemCrafting').html(getCraftingDetails());
}

function getCraftingDetails() {
    var htmlCrafting = '';
    $.each(itemDetails.buildNotes, function (ndx) {
        var eff = itemDetails.buildNotes[ndx];
        htmlCrafting += eff.description;
        if (eff.offset >= 0) {
            htmlCrafting += ' (+' + eff.offset + ')';
        }
        htmlCrafting += '<br />';

    });
    return htmlCrafting;
}

function ddlMaxWealth_change() {
    var maxWealth = parseInt($("#ctrl_MaxWealth").val());
    ctrlSet($(".maxWealth5"), (maxWealth < 5));
    ctrlSet($(".maxWealth4"), (maxWealth < 4));
    ctrlSet($(".maxWealth3"), (maxWealth < 3));
    ctrlSet($(".maxWealth2"), (maxWealth < 2));
}

function ctrlSet(ctrl, hide) {
    var pCtl = ctrl.parent();
    if (hide) {
        pCtl.hide().removeClass('active');
        ctrl.removeAttr('checked');
    }
    else {
        pCtl.show();
    }
}

function ddlItemType_change() {
    var itemType = $.trim($("#ctrl_ItemType").val());

    // Hide everything, then show appropriate div if a selection is made. Also, enable or disable Flaw controls on Creation Details page.
    $("#itemEffects .startHidden").hide();
    var owner = $.trim($('#ctrl_OwnerCharName').val());

    switch (itemType) {
        case "":
            break;
        case "focus":
            $("#itemType_focus").show();
            setFlawEnabledState(false);
            break;
        case "item":
            $("#itemType_item").show();
            setFlawEnabledState(true);
            break;
        case "potion":
            $("#itemType_potion").show();
            setFlawEnabledState(true);
            // Set Owner Status to Open if they haven't entered an owner yet, so they don't default to making a closed potion.
            if (owner == '') { $("#ctrl_OwnerStatus").val('OPEN'); } 
            break;
    }
}

function setFlawEnabledState(enabled) {
    if (enabled) {
        $('#ctrl_Flaw').removeAttr("disabled").removeProp("aria-disabled");
        $('#ctrl_FlawDescription').removeAttr("disabled").removeProp("aria-disabled");
    }
    else {
        $('#ctrl_Flaw').attr("disabled", "disabled").prop("aria-disabled");
        $('#ctrl_Flaw').val('none');
        $('#ctrl_FlawDescription').attr("disabled", "disabled").prop("aria-disabled");
        $('#ctrl_FlawDescription').val('');
    }
}

function validateData(target) {
    errList = [];

    var tabId = 0;
    switch (target) {
        case '#charInfo': tabId = 1; break;
        case '#itemEffects': tabId = 2; break;
        case '#creation': tabId = 3; break;
        case '#results': tabId = 4; break;
    }

    if (!validateCharacterInfo()) {
        // Show issues.
        $("#charInfoTab").tab('show');
        showErrorMessages("Character Information Issue(s)");
        return;
    }
    if (tabId <= 2) { return; }

    if (!buildItem()) {
        // Show issues.
        $("#itemEffectsTab").tab('show');
        showErrorMessages("Item Details - Issue(s)");
        return;
    }

    if (!isComplexityMet()) {
        // Show issues.
        $("#creationTab").tab('show');
        showErrorMessages("Creation Details Issue(s)");
        return;
    }

    // Show item information in final layout
    showItem();
}

function btnClearStress_click() {
    $("[name='radPhysicalStressUsed']").prop('checked', false);
    $("[name='radPhysicalStressUsed']").parent().removeClass('active').removeAttr('aria-pressed');

    $("[name='radMentalStressUsed']").prop('checked', false);
    $("[name='radMentalStressUsed']").parent().removeClass('active').removeAttr('aria-pressed');

    $("[name='radWealthStressUsed']").prop('checked', false);
    $("[name='radWealthStressUsed']").parent().removeClass('active').removeAttr('aria-pressed');
}

function btnAddEvocation_click() {
    switch (focusEvocationShowLevel) {
        case 0:
            $("#rowEvoc1").show();
            $("#btnDelEvoc1").show();
            focusEvocationShowLevel++;
            break;
        case 1:
            $("#rowEvoc2").show();
            $("#btnDelEvoc2").show();
            $("#btnDelEvoc1").hide();
            focusEvocationShowLevel++;
            break;
        case 2:
            $("#rowEvoc3").show();
            $("#btnDelEvoc3").show();
            $("#btnDelEvoc2").hide();
            focusEvocationShowLevel++;
            break;
    }
    setFocusAddButtonStates();
}

function setFocusAddButtonStates() {
    if (focusEvocationShowLevel + focusThaumaturgyShowLevel == 3) {
        $("#btnAddEvocation").attr("disabled", true).prop("aria-disabled", true);
        $("#btnAddThaumaturgy").attr("disabled", true).prop("aria-disabled", true);
    }
    else {
        $("#btnAddEvocation").removeAttr("disabled").removeProp("aria-disabled");
        $("#btnAddThaumaturgy").removeAttr("disabled").removeProp("aria-disabled");
    }
}

function btnDelEvocation_click() {
    switch (focusEvocationShowLevel) {
        case 1:
            $("#rowEvoc1").hide();
            focusEvocationShowLevel--;
            break;
        case 2:
            $("#rowEvoc2").hide();
            $("#btnDelEvoc1").show();
            focusEvocationShowLevel--;
            break;
        case 3:
            $("#rowEvoc3").hide();
            $("#btnDelEvoc2").show();
            focusEvocationShowLevel--;
            break;
    }
    setFocusAddButtonStates();
}

function btnAddThaumaturgy_click() {
    switch (focusThaumaturgyShowLevel) {
        case 0:
            $("#rowThau1").show();
            $("#btnDelThau1").show();
            focusThaumaturgyShowLevel++;
            break;
        case 1:
            $("#rowThau2").show();
            $("#btnDelThau2").show();
            $("#btnDelThau1").hide();
            focusThaumaturgyShowLevel++;
            break;
        case 2:
            $("#rowThau3").show();
            $("#btnDelThau3").show();
            $("#btnDelThau2").hide();
            focusThaumaturgyShowLevel++;
            break;
    }
    setFocusAddButtonStates();
}

function btnDelThaumaturgy_click() {
    switch (focusThaumaturgyShowLevel) {
        case 1:
            $("#rowThau1").hide();
            focusThaumaturgyShowLevel--;
            break;
        case 2:
            $("#rowThau2").hide();
            $("#btnDelThau1").show();
            focusThaumaturgyShowLevel--;
            break;
        case 3:
            $("#rowThau3").hide();
            $("#btnDelThau2").show();
            focusThaumaturgyShowLevel--;
            break;
    }
    setFocusAddButtonStates();
}

function setCharacterInfo() {

    charInfo = {
        lore: parseInt($("#ctrl_Conviction option:selected").val()),
        cast: parseInt($("#ctrl_Casting option:selected").val()),
        foc_complex: parseInt($("#ctrl_FocusBonusComplexity option:selected").val()),
        foc_cast: parseInt($("#ctrl_FocusBonusCasting option:selected").val()),
        spec_focus: parseInt($("#ctrl_SpecializationFocus option:selected").val()),
        spec_power: parseInt($("#ctrl_SpecializationPower option:selected").val()),
        spec_freq: parseInt($("#ctrl_SpecializationFrequency option:selected").val()),
        spec_size: parseInt($("#ctrl_SpecializationSize option:selected").val()),
        max_wealth: parseInt($("#ctrl_MaxWealth").val()), // only used for saving/loading char info
        used_spec_focus: 0,
        used_spec_power: 0,
        spec_focus_avail: true
    };
    charInfo.totalCast = charInfo.cast + charInfo.foc_cast;
}

function validateCharacterInfo() {
    var _valid = true;

    setCharacterInfo();
    $('#charInfo .alert-danger').removeClass('alert-danger');

    // Make sure Approaches aren't both 0.
    if (charInfo.lore == 0 && charInfo.cast == 0) {
        _addErrMsg("You must set your Approaches for Lore and Casting. Since you can only have 1 Mediocre (0) Approach, either Lore or Casting must be greater than 0.");
        _valid = false;

        $("#ctrl_Conviction").addClass('alert-danger');
        $("#ctrl_Casting").addClass('alert-danger');
    }

    // Make sure user can use focus items.
    if (charInfo.lore < charInfo.foc_complex) {
        _addErrMsg("Your Lore is too low to use a Complexity Focus Item of that power.");
        $("#ctrl_FocusBonusComplexity").addClass('alert-danger');
        _valid = false;
    }
    if (charInfo.lore < charInfo.foc_cast) {
        _addErrMsg("Your Lore is too low to use a Casting Focus Item of that power.");
        $("#ctrl_FocusBonusCasting").addClass('alert-danger');
        _valid = false;
    }

    // Confirm that Specializations follow the proper ladder
    var ladder = [0, 0, 0, 0];
    ladder[charInfo.spec_focus]++;
    ladder[charInfo.spec_power]++;
    ladder[charInfo.spec_freq]++;
    ladder[charInfo.spec_size]++;

    if (ladder[3] > ladder[2]) {
        _addErrMsg("You cannot have more x3 specializations than you have x2 specializations.");
        $("[id^='ctrl_Specialization']").addClass('alert-danger');
        _valid = false;
    }
    if (ladder[2] > ladder[1]) {
        _addErrMsg("You cannot have more x2 specializations than you have x1 specializations.");
        $("[id^='ctrl_Specialization']").addClass('alert-danger');
        _valid = false;
    }

    return _valid;
}

function buildItem() {
    var isValid = true;
    $('#itemEffects .alert-danger').removeClass('alert-danger');

    itemDetails = {
        itemType: '',
        complexity: 0,
        power: 0,
        slots: 0,
        actualPower: 0,
        effects: new Array(),
        buildNotes: new Array(),
        name: '',
        desc: '',
        owner: '',
        uses: 0,
        flawHtml: '',
        repeatEffectCount: 0,
        isGas: false,
        concealAccum: 0,
        concealCount: 0
    };

    // Basic Item Details
    itemDetails.itemType = $("#ctrl_ItemType").val();
    itemDetails.name = $.trim($('#ctrl_ItemTitle').val());
    itemDetails.desc = $.trim($('#ctrl_ItemDescription').val());

    if (itemDetails.itemType == '') {
        _addErrMsg("You must select an item type.");
        isValid = false;
    }

    if (itemDetails.name == '') {
        _addErrMsg("Item Title is required.");
        isValid = false;
        $("#ctrl_ItemTitle").addClass('alert-danger');
    }

    if (itemDetails.desc == '') {
        _addErrMsg("Item Description is required.");
        isValid = false;
        $("#ctrl_ItemDescription").addClass('alert-danger');
    }

    // Ownership details
    var status = $("#ctrl_OwnerStatus option:selected").val();
    if (status == 'OPEN') {
        $('#ctrl_OwnerCharName').val("");
        itemDetails.owner = "OPEN";
    }
    else {
        itemDetails.owner = $.trim($('#ctrl_OwnerCharName').val());
        if (itemDetails.owner == '') {
            _addErrMsg("Closed items must specify the name of the character to which they are attuned.");
            isValid = false;
            $("#ctrl_OwnerCharName").addClass('alert-danger');
        }
    }

    // For non-focus items, check for ownership first; for focus, check last. 
    if (itemDetails.itemType != 'focus') { addOwnershipCost(); }
    switch (itemDetails.itemType) {
        case 'focus': if (!buildFocusItem()) { isValid = false; }; break;
        case 'item': if (!buildEnchantedItem()) { isValid = false; } break;
        case 'potion': if (!buildPotion()) { isValid = false; } break;
        default: break;
    }
    if (itemDetails.itemType == 'focus') { addOwnershipCost(); }

    if (itemDetails.effects.length == 0) {
        _addErrMsg("This item has no effects.");
        isValid = false;
    }

    // Calculate Power, Complexity, Slots, Success Chance
    $.each(itemDetails.effects, function (ndx) {
        var eff = itemDetails.effects[ndx];
        itemDetails.slots += eff.slots;
        itemDetails.power += eff.power;
        itemDetails.actualPower += eff.actualPower;
    });

    // All items have a minimum cost. If specializations have lowered power & slot costs to zero, set to default mins. Note that Focus Items have already adjusted for this.
    if (isValid && (itemDetails.slots <= 0 || itemDetails.power <= 0)) {
        if (itemDetails.itemType != 'focus') {
            var newSlot = itemDetails.slots <= 0 ? 1 : 0;
            var newPower = itemDetails.power <= 0 ? 1 : 0;

            itemDetails.slots += newSlot;
            itemDetails.power += newPower;

            addEffect(0, newSlot, newPower, "Power Specialization reduced the cost to 0. Increased slot and/or power to meet default requirements.", "{0}", "");
        }
    }

    var oddsIndex;
    var flawlessIndex;
    var totalCasting = 0;
    var flawlessMod = 1;
    if (itemDetails.itemType == 'focus') {
        // Verify power is valid.
        if (itemDetails.actualPower > charInfo.lore) {
            isValid = false;
            _addErrMsg("Focus Item's Power (" + itemDetails.actualPower + ") cannot exceed your Lore rating (" + charInfo.lore + ").");
        }
        // Calculate Complexity
        // Power + # slots - (Capacity/Lore - (Power + # slots))
        itemDetails.complexity = Math.max(2 * (itemDetails.power + itemDetails.slots) - charInfo.lore, 0);

        // Determine chance of success; Focus items cannot use focus items to enhance casting success!
        totalCasting = charInfo.cast;
        flawlessMod = 0;
    }
    else {
        // Verify power is valid.
        if (itemDetails.actualPower > (charInfo.lore * 2)) {
            isValid = false;
            _addErrMsg((itemDetails.itemType == 'item' ? "Enchanted Item" : "Potion") + "'s Power (" + itemDetails.actualPower + ") cannot exceed twice your Lore rating (" + charInfo.lore + " * 2).");
        }

        // Calculate Complexity
        itemDetails.complexity = itemDetails.power + itemDetails.slots;
        totalCasting = charInfo.totalCast;
    }
    // Determine chance of success
    oddsIndex = itemDetails.power - totalCasting + 4;
    flawlessIndex = oddsIndex + flawlessMod;

    var styleIndex = oddsIndex + 3;

    if (oddsIndex < 0) { oddsIndex = 0; }
    else if (oddsIndex > 8) { oddsIndex = 8; }

    if (flawlessIndex < 0) { flawlessIndex = 0; }
    else if (flawlessIndex > 8) { flawlessIndex = 8; }

    if (styleIndex < 0) { styleIndex = 0; }
    else if (styleIndex > 8) { styleIndex = 8; }

    var chance = odds[oddsIndex];
    var flawless = odds[flawlessIndex];
    var style = odds[styleIndex];

    if (itemDetails.power < itemDetails.actualPower) {
        $("#divPower").html("<span><b>Power:</b> " + itemDetails.power + ' (eff. ' + itemDetails.actualPower + ')' + "</span>");
    }
    else {
        $("#divPower").html("<span><b>Power:</b> " + itemDetails.power + "</span>");
    }

    $("#divSlots").html("<span><b>Slots:</b> " + itemDetails.slots + "</span>");
    $("#divComplexity").html("<span><b>Complexity:</b> " + itemDetails.complexity + "</span>");

    var successHtml = '<span class="mr-4"><b>Success:</b> ' + chance + '%</span>' +
        '<span class="mr-4"><b>Flawless:</b> ' + flawless + '%</span>' +
        '<span class="mr-4"><b>w/ Style:</b> ' + style + '%</span>' +
        '<span><b>Power vs. Casting:</b> ' + itemDetails.power + ' vs. ' + totalCasting + '</span>';

    $("#divChance").html(successHtml);
    $("#divChance").removeClass('alert-success alert-info alert-warning alert-danger');

    if (oddsIndex < 3) {
        $("#divChance").addClass('alert-success');
    }
    else if (oddsIndex < 4) {
        $("#divChance").addClass('alert-info');
    }
    else if (oddsIndex < 5) {
        $("#divChance").addClass('alert-warning');
    }
    else {
        $("#divChance").addClass('alert-danger');
    }

    return isValid;
}

function addEffect(actPwr, sl, pwr, desc, fmt, bns) {
    var e = {
        power: parseInt(pwr),
        actualPower: parseInt(actPwr),
        slots: parseInt(sl),
        description: desc,
        format: fmt,
        bonus: bns,
    };
    itemDetails.effects.push(e);
}

function addBuildNote(off, desc) {
    var bn = {
        offset: off,
        description: desc
    };
    itemDetails.buildNotes.push(bn);
}

function buildFocusItem() {
    var isValid = true;

    // Special case pre-check: If user has a focus specialization, and total power of focus is 1 excluding ownership, disable focus specialization.
    if (charInfo.spec_focus > 0 && (focusEvocationShowLevel + focusThaumaturgyShowLevel) == 1) {
        var tStr = focusThaumaturgyShowLevel > 0 ? parseInt($("#ctrlThauStr1").val()) : 0;
        var eStr = focusEvocationShowLevel > 0 ? parseInt($("#ctrlEvocStr1").val()) : 0;
        var total = (isNaN(tStr) ? 0 : tStr) + (isNaN(eStr) ? 0 : eStr);
        if (total == 1) { charInfo.spec_focus_avail = false; }
    }

    // Evocation
    if (focusEvocationShowLevel > 0) {
        if (validateAndBuildEvocationFocusEffect(1) == false) { isValid = false; }
    }
    if (focusEvocationShowLevel > 1) {
        if (validateAndBuildEvocationFocusEffect(2) == false) { isValid = false; }
    }
    if (focusEvocationShowLevel > 2) {
        if (validateAndBuildEvocationFocusEffect(3) == false) { isValid = false; }
    }

    // Thaumaturgy
    if (focusThaumaturgyShowLevel > 0) {
        if (validateAndBuildThaumaturgyFocusEffect(1) == false) { isValid = false; }
    }
    if (focusThaumaturgyShowLevel > 1) {
        if (validateAndBuildThaumaturgyFocusEffect(2) == false) { isValid = false; }
    }
    if (focusThaumaturgyShowLevel > 2) {
        if (validateAndBuildThaumaturgyFocusEffect(3) == false) { isValid = false; }
    }
    spec_focus_avail = true;

    return isValid;
}

function validateAndBuildThaumaturgyFocusEffect(num) {
    var isValid = true;

    var type = $("#ctrlThauType" + num).val();
    var disc = $("#ctrlThauDiscipline" + num).val();
    var str = parseInt($("#ctrlThauStr" + num).val());

    if (type == '') {
        isValid = false;
        _addErrMsg("Thaumaturgy / Ritual Effect " + num + " Complexity or Casting is required.");
    }

    if (disc == '') {
        isValid = false;
        _addErrMsg("Thaumaturgy / Ritual Effect " + num + " Discipline is required.");
    }

    if (str == '') {
        isValid = false;
        _addErrMsg("Thaumaturgy / Ritual Effect " + num + " Strength is required.");
    }

    if (isValid) {
        var fmtStr = type + " " + disc + " +{0}";
        if (charInfo.spec_focus_avail && (charInfo.spec_focus > charInfo.used_spec_focus)) {
            // Character has specialization available to reduce cost.
            var specStr = charInfo.spec_focus - charInfo.used_spec_focus;

            if (specStr >= str) {
                // Specialization pays for the entire effect.
                addEffect(str, str * 2, 0, type + " " + disc + " +" + str + " (from focus specialization)", fmtStr, str);
                charInfo.used_spec_focus += str;
            }
            else {
                // Specialization pays for a portion of the effect. 
                var newStr = str - specStr;
                var freeStr = specStr;

                addEffect(str, newStr * 2, newStr, type + " " + disc + " +" + str + " (including +" + freeStr + " bonus from focus specialization)", fmtStr, str);
                charInfo.used_spec_focus += specStr;
            }
        }
        else {
            // No specialization bonus.
            addEffect(str, str * 2, str, type + " " + disc + " +" + str, fmtStr, str);
        }
    }

    return isValid;
}

function validateAndBuildEvocationFocusEffect(num) {
    var isValid = true;

    var type = $("#ctrlEvocType" + num).val();
    var offDef = $("#ctrlEvocOffDef" + num).val();
    var elem = $("#ctrlEvocElem" + num).val();
    var str = parseInt($("#ctrlEvocStr" + num).val());

    if (type == '') {
        isValid = false;
        _addErrMsg("Evocation / Channeling Effect " + num + " Power or Casting is required.");
    }

    if (offDef == '') {
        isValid = false;
        _addErrMsg("Evocation / Channeling Effect " + num + " Offensive or Defensive is required.");
    }

    if (elem == '') {
        isValid = false;
        _addErrMsg("Evocation / Channeling Effect " + num + " Element is required.");
    }

    if (isNaN(str)) {
        isValid = false;
        _addErrMsg("Evocation / Channeling Effect " + num + " Strength is required.");
    }

    if (isValid) {
        var fmtStr = offDef + " " + elem + " " + type + " +{0}";

        if (charInfo.spec_focus_avail && (charInfo.spec_focus > charInfo.used_spec_focus)) {
            // Character has specialization available to reduce cost.
            var specStr = charInfo.spec_focus - charInfo.used_spec_focus;

            if (specStr >= str) {
                // Specialization pays for the entire effect.
                addEffect(str, 0, 0, offDef + " " + elem + " " + type + " +" + str + " (from focus specialization)", fmtStr, str);
                charInfo.used_spec_focus += str;
            }
            else {
                // Specialization pays for a portion of the effect.
                var newStr = str - specStr;
                var freeStr = specStr;

                addEffect(str, newStr * 2, newStr, offDef + " " + elem + " " + type + " +" + str + " (including +" + freeStr + " bonus from focus specialization)", fmtStr, str);
                charInfo.used_spec_focus += specStr;
            }
        }
        else {
            // No specialization bonus.
            addEffect(str, str * 2, str, offDef + " " + elem + " " + type + " +" + str, fmtStr, str);
        }
    }

    return isValid;
}

// Item / Potion effect cost reference
// Damage [+<=Lore, 1 slot]
// Protection [+<=Lore, 1 slot]
// Advantage [+2, 1 slot]
// Nonmagical Stunt [+2, 1 slot]
// Magical Stunt [+2, 1 slot]
// Block [+<=Lore, 1 slot]
// Hex [+<=Lore, 1 slot]
// Strength [+1, 1 slot]
// Dose [+1, 0 slots]
// Gas [+2, 0 slot]
// Undetectable. [+1, 0 slots]
// Open/Close [+1, 1 slot]

function buildEnchantedItem() {
    var isValid = true;

    // Additional Uses
    // NOTE: If user doesn't have 'Additional Uses' specialization, they must repurchase each effect for the additional use.
    // We'll check this first to see if we have to purchase multiple effects.
    var totalUses = parseInt($('#ctrl_ItemUses').val());
    var bAddUsesNote = false;
    var sAddUsesNoteText = '';
    itemDetails.repeatEffectCount = 0;

    if (charInfo.spec_freq > 0) {
        bAddUsesNote = true;
        var sAddUsesNoteText = charInfo.spec_freq + ' additional use' + (charInfo.spec_freq == 1 ? '' : 's') + ' from Frequency Specialization';
        if (totalUses <= charInfo.spec_freq) {
            itemDetails.uses = charInfo.spec_freq + 1; // Whether user has remembered to set the add'l uses or not, apply it.
        }
        else {
            // User selected more uses than his spec grants.
            itemDetails.repeatEffectCount = totalUses - charInfo.spec_freq - 1;
            itemDetails.uses = totalUses;
        }
    }
    else {
        itemDetails.repeatEffectCount = totalUses - 1;
        itemDetails.uses = totalUses;
    }

    // Damage
    var damageStr = parseInt($('#ctrl_DamageStr').val());
    var damageDesc = $.trim($('#ctrl_DamageElement').val());
    var damageAdded = parseInt($('#ctrl_DamageAdded').val());
    if (!addVariableEffect('Damage', 'Element', damageDesc, damageStr, damageAdded)) { isValid = false; }

    // Protection
    var protStr = parseInt($('#ctrl_ProtStr').val());
    var protDesc = $.trim($('#ctrl_ProtType').val());
    var protAdded = parseInt($('#ctrl_ProtAdded').val());
    if (!addVariableEffect('Protection', 'Type', protDesc, protStr, protAdded)) { isValid = false; }

    // Block
    var blockStr = parseInt($('#ctrl_BlockStr').val());
    var blockDesc = $.trim($('#ctrl_BlockType').val());
    var blockAdded = parseInt($('#ctrl_BlockAdded').val());
    if (!addVariableEffect('Block', 'Type', blockDesc, blockStr, blockAdded)) { isValid = false; }

    // Hex
    var hexStr = parseInt($('#ctrl_HexStr').val());
    var hexAdded = parseInt($('#ctrl_HexAdded').val());
    if (!addVariableEffect('Hex', '', 'HIDE', hexStr, hexAdded)) { isValid = false; }

    // Non-magical Stunt
    var nonmagicStuntApproach = $.trim($('#ctrl_NonMagStuntApproach').val());
    var nonmagicStuntAction = $.trim($('#ctrl_NonMagStuntAction').val());

    if (nonmagicStuntApproach != '--' && nonmagicStuntAction != '--') {
        addBasicEffect('Non-magical Stunt', '+2 when ' + nonmagicStuntApproach + ' ' + nonmagicStuntAction);
    }
    else if (nonmagicStuntApproach != '--') {
        isValid = false;
        _addErrMsg("A non-magical stunt action is missing.");
    }
    else if (nonmagicStuntAction != '--') {
        isValid = false;
        _addErrMsg("A non-magical stunt approach is missing.");
    }

    // Magical Stunt
    var magicStuntDesc = $.trim($('#ctrl_MagicalStuntDesc').val());
    addBasicEffect('Magical Stunt', magicStuntDesc);

    // Advantage
    var advantageDesc = $.trim($('#ctrl_AdvantageDescription').val());
    addBasicEffect('Advantage', advantageDesc);

    // If Power Spec > 0, identify effect(s) to pay for. Loop through effects with slots, then effects w/out. 

    if (sAddUsesNoteText) {
        addEffect(0, 0, 0, sAddUsesNoteText, "{0}", "");
    }

    return isValid;
}

function buildPotion() {
    var isValid = true;

    // Doses
    // Note: Since potion doses are more effecient than extra uses for enchanted items, and since the Frequency specialization doesn't 
    // apply to potions, we apply Power specialization to doses first. If we didn't, most potions would be 0-slot items if Power Specialization
    // paid off their base power completely.
    var totalUses = parseInt($('#ctrl_PotionDoses').val());
    itemDetails.uses = totalUses;
    addPotionDoses(totalUses);

    // Concealment
    // Note: As above, we want to avoid a zero-slot potion, so if we can use up Power Specialization on concealment, do so now.
    getPotionConcealment('chkUndetectableSight');
    getPotionConcealment('chkUndetectableSound');
    getPotionConcealment('chkUndetectableScent');
    getPotionConcealment('chkUndetectableTouch');
    getPotionConcealment('chkUndetectableTaste');
    getPotionConcealment('chkUndetectableMagic');
    addPotionConcealment();

    // Damage
    var damageStr = parseInt($('#ctrl_PotionDamageStr').val());
    var damageDesc = $.trim($('#ctrl_PotionDamageElement').val());
    var damageAdded = parseInt($('#ctrl_PotionDamageAdded').val());
    if (!addVariableEffect('Damage', 'Element', damageDesc, damageStr, damageAdded)) { isValid = false; }

    // Protection
    var protStr = parseInt($('#ctrl_PotionProtStr').val());
    var protDesc = $.trim($('#ctrl_PotionProtType').val());
    var protAdded = parseInt($('#ctrl_PotionProtAdded').val());
    if (!addVariableEffect('Protection', 'Type', protDesc, protStr, protAdded)) { isValid = false; }

    // Block
    var blockStr = parseInt($('#ctrl_PotionBlockStr').val());
    var blockDesc = $.trim($('#ctrl_PotionBlockType').val());
    var blockAdded = parseInt($('#ctrl_PotionBlockAdded').val());
    if (!addVariableEffect('Block', 'Type', blockDesc, blockStr, blockAdded)) { isValid = false; }

    // Hex
    var hexStr = parseInt($('#ctrl_PotionHexStr').val());
    var hexAdded = parseInt($('#ctrl_PotionHexAdded').val());
    if (!addVariableEffect('Hex', '', 'HIDE', hexStr, hexAdded)) { isValid = false; }

    // Non-magical Stunt
    var nonmagicStuntApproach = $.trim($('#ctrl_PotionNonMagStuntApproach').val());
    var nonmagicStuntAction = $.trim($('#ctrl_PotionNonMagStuntAction').val());

    if (nonmagicStuntApproach != '--' && nonmagicStuntAction != '--') {
        addBasicEffect('Non-magical Stunt', '+2 when ' + nonmagicStuntApproach + ' ' + nonmagicStuntAction);
    }
    else if (nonmagicStuntApproach != '--') {
        isValid = false;
        _addErrMsg("A non-magical stunt action is missing.");
    }
    else if (nonmagicStuntAction != '--') {
        isValid = false;
        _addErrMsg("A non-magical stunt approach is missing.");
    }

    // Magical Stunt
    var magicStuntDesc = $.trim($('#ctrl_PotionMagicalStuntDesc').val());
    addBasicEffect('Magical Stunt', magicStuntDesc);

    // Advantage
    var advantageDesc = $.trim($('#ctrl_PotionAdvantageDescription').val());
    addBasicEffect('Advantage', advantageDesc);

    // Gas
    //ctrl_PotionIsGas
    addPotionGas($.trim($('#ctrl_PotionIsGas').val()));

    return isValid;
}

function addOwnershipCost() {
    if (itemDetails.owner == "OPEN" && itemDetails.itemType == 'potion') { return; }
    if (itemDetails.owner != "OPEN" && itemDetails.itemType != 'potion') { return; }
    var ownerDesc = ((itemDetails.owner == "OPEN") ? "Item opened to all" : "Item keyed to " + itemDetails.owner)
    var powerCost = 1;
    var slotCost = 1;
    var freePwr;
    var specDesc = "";

    if (itemDetails.itemType == 'focus') {
        freePwr = (charInfo.spec_focus - charInfo.used_spec_focus);
        if (freePwr > 0) {
            // Pay for ownership out of specialization.
            specDesc = " (from Focus Specialization)";
            powerCost = 0;
            charInfo.used_spec_focus++;
        }

        // Note: Making a focus item open does not cost a slot.
        slotCost = 0;
    }
    else {
        freePwr = (charInfo.spec_power - charInfo.used_spec_power);
        if (freePwr > 0) {
            // Pay for ownership out of specialization.
            specDesc = " (from Power Specialization)";
            powerCost = 0;
            slotCost = 0;
            charInfo.used_spec_power++;
        }
    }

    addEffect(1, slotCost, powerCost, ownerDesc + specDesc, "{0}", "");
}

function addPotionGas(isGas) {
    var freePwr = (charInfo.spec_power - charInfo.used_spec_power);
    itemDetails.isGas = false;

    if (isGas == 'Yes') {
        itemDetails.isGas = true;
        if (freePwr > 0) {
            // Use up all free power 
            var freeStr = Math.min(freePwr, 2);

            if (freeStr == 1) {
                addEffect(1, 0, 0, "Gas (power partially offset by Power Specialization)", "{0}", "");
                addEffect(1, 0, 1, 'Gas', "{0}", "");
            }
            else {
                addEffect(2, 0, 0, 'Gas (from Power Specialization)', "{0}", "");
            }
            charInfo.used_spec_power += freeStr;
        }
        else {
            addEffect(2, 0, 2, 'Gas', "{0}", "");
        }
    }
}

function getPotionConcealment(ctrlId) {
    var value = parseInt($('#' + ctrlId + ':checked').val());
    if (!isNaN(value)) {
        itemDetails.concealAccum += value;
        itemDetails.concealCount++;
    }
}

function addPotionConcealment() {
    if (itemDetails.concealCount == 0) { return; }
    var freeSense = new Array();
    var paidSense = new Array();
    var accum = itemDetails.concealAccum;

    var freePwr = (charInfo.spec_power - charInfo.used_spec_power);

    if (accum >= 32) { if (freePwr > 0) { freePwr--; freeSense.push('Magic'); } else { paidSense.push('Magic'); } accum -= 32; }
    if (accum >= 16) { if (freePwr > 0) { freePwr--; freeSense.push('Taste'); } else { paidSense.push('Taste'); } accum -= 16; }
    if (accum >= 8) { if (freePwr > 0) { freePwr--; freeSense.push('Touch'); } else { paidSense.push('Touch'); } accum -= 8; }
    if (accum >= 4) { if (freePwr > 0) { freePwr--; freeSense.push('Scent'); } else { paidSense.push('Scent'); } accum -= 4; }
    if (accum >= 2) { if (freePwr > 0) { freePwr--; freeSense.push('Sound'); } else { paidSense.push('Sound'); } accum -= 2; }
    if (accum >= 1) { if (freePwr > 0) { freePwr--; freeSense.push('Sight'); } else { paidSense.push('Sight'); } accum -= 1; }

    var fullSense = freeSense.concat(paidSense);
    var effDesc = "Undetectable to: " + fullSense.join(', ') + '{0}';

    if (freeSense.length > 0) {
        charInfo.used_spec_power += freeSense.length;
        addEffect(freeSense.length, 0, 0, "Undetectable to: " + freeSense.join(', ') + ' (from Power Specialization)', effDesc, '');
    }

    if (paidSense.length > 0) {
        addEffect(paidSense.length, 0, paidSense.length, "Undetectable to: " + paidSense.join(', '), effDesc, '');
    }
}

function addPotionDoses(count) {
    var freePwr = (charInfo.spec_power - charInfo.used_spec_power);
    if (count > 1) {
        var addedDoses = count - 1;

        if (freePwr > 0) {
            addEffect(freePwr, 0, 0, freePwr + ' Additional Doses (from Power Specialization)', "{0}", "");
            var paidDoses = (addedDoses - freePwr);
            if (paidDoses > 0) {
                addEffect(paidDoses, 0, paidDoses, paidDoses + ' Additional Doses', "{0}", "");
            }
            charInfo.used_spec_power += freePwr;
        }
        else {
            addEffect(addedDoses, 0, addedDoses, 'Additional Doses', "{0}", "");
        }
    }
}

// Variable effects have a strength rating, with possible additional strength added.
function addVariableEffect(effectName, descErrText, desc, baseStr, addStr) {
    var isValid = true;
    var repEff = itemDetails.repeatEffectCount;
    var addPartial = false;
    var freeUses = 0;

    // Validate
    if (isNaN(baseStr)) {
        if (addStr > 0) {
            _addErrMsg("{0} cannot add strength unless base effect strength is selected.".format(effectName));
            isValid = false;
        }
        else {
            if (desc != "--" && desc != "HIDE") {
                _addErrMsg("{0} is missing base effect strength.".format(effectName));
                isValid = false;
            }
        }
    } else {
        if (desc == "--") {
            _addErrMsg("{0} is missing {1}.".format(effectName, descErrText));
            isValid = false;
        }
    }

    if (!isValid) { return false; }

    if (baseStr > 0) {
        var nameAndDesc = effectName + " (" + desc + ")";
        if (desc == 'HIDE') {
            nameAndDesc = effectName;
        }

        var effFormat = nameAndDesc + " +{0}";

        var loops = 1 + repEff;
        while (loops > 0) {
            var totalUsesText = loops > 1 ? " towards additional uses" : "";

            // (1): "loops > 1 ? 0 : X" -> If we're trying to pay for additional uses w/out frequency specialization, don't set bonus, so we don't double-count it.

            // Since power has a higher str to slot ratio, try to get it for free first. 
            if (addStr > 0) {
                if ((charInfo.spec_power - charInfo.used_spec_power) > 0) {
                    var freeStr = Math.min((charInfo.spec_power - charInfo.used_spec_power), addStr);
                    charInfo.used_spec_power += freeStr;

                    addEffect(freeStr, 0, 0, effFormat.format(freeStr + ' (+Strength) provided by Power Specialization' + totalUsesText), effFormat, loops > 1 ? 0 : freeStr);; // (1)
                    if (freeStr < addStr) {
                        var paidAdded = addStr - freeStr;
                        addEffect(paidAdded, paidAdded, paidAdded, effFormat.format(paidAdded + ' (+Strength)' + totalUsesText), effFormat, loops > 1 ? 0 : paidAdded); // (1)
                    }
                }
                else {
                    addEffect(addStr, addStr, addStr, effFormat.format(addStr + ' (+Strength)' + totalUsesText), effFormat, loops > 1 ? 0 : addStr); // (1)
                }
            }

            // If there are still available spec_power, split and pay down base power
            var applySpecToBase = ((charInfo.spec_power - charInfo.used_spec_power) > 0);
            if (applySpecToBase && loops > 1 && addStr > 0) {
                applySpecToBase = false; // Don't apply discount now - it's more valuable to pay down the additional damage on the next loop.
            }

            if (applySpecToBase) {
                var freeStr = Math.min((charInfo.spec_power - charInfo.used_spec_power), baseStr);
                var paidStr = baseStr - freeStr;
                charInfo.used_spec_power += freeStr;

                addEffect(freeStr, 0, 0, nameAndDesc + " +" + freeStr + ' (<=Lore) provided by Power Specialization' + totalUsesText, effFormat, loops > 1 ? 0 : freeStr); // (1)
                if (paidStr > 0) {
                    addEffect(paidStr, 1, paidStr, nameAndDesc + " +" + paidStr + ' (<=Lore)' + totalUsesText, effFormat, loops > 1 ? 0 : paidStr); // (1)
                }
            }
            else {
                addEffect(baseStr, 1, baseStr, nameAndDesc + " +" + baseStr + ' (<=Lore)' + totalUsesText, effFormat, loops > 1 ? 0 : baseStr); // (1)
            }

            loops--;
        }
    }
    return true; // If we got this far, we passed.
}

// Basic effects only have a description, and always cost 2 power / 1 slot. 
function addBasicEffect(effectName, desc) {
    var repEff = itemDetails.repeatEffectCount;
    var addPartial = false;
    var freeUses = 0;

    if (desc != '') {
        var effFormat = effectName + "  (" + desc + "){0}";

        if (repEff > 0) {
            while ((charInfo.spec_power - charInfo.used_spec_power) > 0 && repEff > 0) {
                // Pay off some or all of at least one additional use.
                if ((charInfo.spec_power - charInfo.used_spec_power) % 2 == 0) {
                    freeUses += 1;
                    charInfo.used_spec_power += 2;
                }
                else {
                    // Add a partially-paid effect after regular batch.
                    addPartial = true;
                    charInfo.used_spec_power += 1;
                }
                repEff -= 1;
            }

            if (repEff > 0) {
                addEffect(repEff * 2, repEff, repEff * 2, effectName + " (" + repEff + " additional use" + (repEff > 1 ? "s" : "") + ")", effFormat, "");
            }

            if (addPartial) {
                addEffect(2, 1, 1, effectName + " (power partially offset by Power Specialization)", effFormat, "");
            }

            if (freeUses > 0) {
                addEffect(2, 0, 0, effectName + ' (' + freeUses + ' additional use' + (freeUses == 1 ? '' : 's') + ' from Power Specialization)', effFormat, "");
            }
        }

        if ((charInfo.spec_power - charInfo.used_spec_power) > 0) {
            // Pay off base power. This can reduce base power cost to zero (0).
            var freePwr = Math.min((charInfo.spec_power - charInfo.used_spec_power), 2);
            if (freePwr == 2) {
                addEffect(2, 0, 0, effectName + ' (from Power Specialization)', effFormat, "");
                charInfo.used_spec_power += 2;
            }
            else {
                addEffect(freePwr, 0, 0, effectName + ' (power reduced by Power Specialization)', effFormat, "");
                addEffect((2 - freePwr), 1, (2 - freePwr), effectName + "  (" + desc + ")", effFormat, "");
                charInfo.used_spec_power += (2 - freePwr);
            }
        }
        else {
            addEffect(2, 1, 2, effectName + "  (" + desc + ")", effFormat, "");
        }
    }
}

function handleConsequence(usedId, availId, type) {
    var complexity = 0;
    var usedCtrl = parseInt($('#' + usedId + ':checked').val());
    var availCtrl = parseInt($('#' + availId + ':checked').val());

    if (!isNaN(usedCtrl)) {
        complexity = usedCtrl;
        addBuildNote(usedCtrl, 'The character gained a ' + type + ' Consequence, contributing ' + usedCtrl + ' towards meeting complexity.');

        if (!isNaN(availCtrl) && usedCtrl > 0) {
            // Check if consequence is available. (It should have been disabled via the Character Info control.)
            complexity = -1;
            _addErrMsg("The " + type + " Consequence has already been used according to the Character Information tab.");
        }
    }

    return complexity;
}

function handleStress(usedId, availId, type, str) {
    var complexity = 0;

    var usedCtrl = parseInt($('input[name=' + usedId + ']:checked').val());

    if (!isNaN(usedCtrl)) {
        complexity = usedCtrl * str;

        var stressDesc = usedCtrl + ' ' + type;
        addBuildNote(complexity, 'The character spent a ' + stressDesc + ' stress box towards Complexity.');

        if (usedCtrl > 0) {
            var id = '#' + availId + usedCtrl + ':checked';
            var availCtrl = parseInt($(id).val());

            if (!isNaN(availCtrl)) {
                // Check if consequence is available. (It should have been disabled via the Character Info control.)
                complexity = -1;
                _addErrMsg("The " + stressDesc + " stress box hass already been used according to the Character Information tab.");
            }
        }
    }

    return complexity;
}

function isComplexityMet() {
    var isValid = true;

    var reqCompl = itemDetails.complexity;
    addBuildNote(-1, 'This item required ' + reqCompl + ' complexity.');

    // Base lore counts towards complexity.
    var allocCompl = charInfo.lore;
    addBuildNote(charInfo.lore, "The character's Lore contributed " + charInfo.lore + " towards meeting complexity.");

    // Focus item bonus - cannot be used when crafting focus items!
    if (charInfo.foc_complex > 0 && itemDetails.itemType != 'focus') {
        var needed = Math.min(reqCompl - allocCompl, charInfo.foc_complex);
        if (needed > 0) {
            allocCompl += needed;
            addBuildNote(needed, "The character's Thaumaturgy Crafting Complexity Focus Item +" + charInfo.foc_complex + " contributed " + needed + " towards meeting complexity.");
        }
    }

    var craftWeek = $('#ctrl_CraftingWeek').val();
    if (craftWeek == 'solo') {
        allocCompl += 3;
        addBuildNote(3, 'The entire week was dedicated to crafting this item.');
    }
    else {
        addBuildNote(0, 'This item was one of several created during the week.');
    }

    var addedWeeks = parseInt($('#ctrlAdditionalWeeks').val());
    if (addedWeeks > 0) {
        allocCompl += (3 * addedWeeks);
        addBuildNote((3 * addedWeeks), 'Additionally, ' + addedWeeks + ' week' + (addedWeeks > 1 ? 's were' : ' was') + ' spent preparing to create the item.');
    }

    // STRESS
    var stressVal = handleStress('radPhysicalStressUsed', 'chkPhyStressAvail', 'Physical', 1);
    if (stressVal < 0) { isValid = false; } else { allocCompl += stressVal; }

    stressVal = handleStress('radMentalStressUsed', 'chkMenStressAvail', 'Mental', 1);
    if (stressVal < 0) { isValid = false; } else { allocCompl += stressVal; }

    stressVal = handleStress('radWealthStressUsed', 'chkWealthStressAvail', 'Wealth', 2);
    if (stressVal < 0) { isValid = false; } else { allocCompl += stressVal; }

    // CONSEQUENCES
    var consVal = handleConsequence('chkPhyConsUsed1', 'chkPhyConsAvail1', 'Mild Physical');
    if (consVal < 0) { isValid = false; } else { allocCompl += consVal; }

    consVal = handleConsequence('chkPhyConsUsed2', 'chkPhyConsAvail2', 'Moderate Physical');
    if (consVal < 0) { isValid = false; } else { allocCompl += consVal; }

    consVal = handleConsequence('chkPhyConsUsed3', 'chkPhyConsAvail3', 'Severe Physical');
    if (consVal < 0) { isValid = false; } else { allocCompl += consVal; }

    consVal = handleConsequence('chkMentConsUsed1', 'chkMentConsAvail1', 'Mild Mental');
    if (consVal < 0) { isValid = false; } else { allocCompl += consVal; }

    consVal = handleConsequence('chkMentConsUsed2', 'chkMentConsAvail2', 'Moderate Mental');
    if (consVal < 0) { isValid = false; } else { allocCompl += consVal; }

    consVal = handleConsequence('chkMentConsUsed3', 'chkMentConsAvail3', 'Severe Mental');
    if (consVal < 0) { isValid = false; } else { allocCompl += consVal; }

    // FLAW
    var flaw = $('#ctrl_Flaw').val();
    var flawDesc = $('#ctrl_FlawDescription').val();
    var flawDelta = 0; // Allows user to 'overspend' on complexity if flaw is the only overage.

    if (flaw != 'none' && itemDetails.itemType == 'focus') {
        // Note: UI should disable flaw controls for focus items, so this check should not be required.
        isValid = false;
        _addErrMsg("Flaws cannot be taken for focus items.");
    }
    else {
        switch (flaw) {
            case 'cost':
                allocCompl += 2;
                addBuildNote(2, 'The character added a Flaw (cost) to contribute 2 towards Complexity.');
                itemDetails.flawHtml = '<b>Cost:</b> ' + flawDesc;
                flawDelta = 2;
                break;
            case 'weak':
                allocCompl += 2;
                addBuildNote(2, 'The character added a Flaw (weakness) to contribute 2 towards Complexity.');
                itemDetails.flawHtml = '<b>Weakness:</b> ' + flawDesc;
                flawDelta = 2;
                break;
            default:
                itemDetails.flawHtml = '';
                break;
        }
    }

    // Validate complexity
    var complexDiff = reqCompl - allocCompl;
    $("#divComplexityRequired").removeClass('alert-success alert-warning alert-danger');

    if (complexDiff > 0) {
        isValid = false;
        _addErrMsg("The item required Complexity has not been met.");
        $('#divComplexityRequired').html("<span><b>Complexity still needed to complete item creation:</b> " + complexDiff + "</span>");
        $("#divComplexityRequired").addClass('alert-danger');
    }
    else if (allocCompl > charInfo.lore && (complexDiff + flawDelta) < 0) {
        isValid = false;
        _addErrMsg("Too many resources have been allocated towards Complexity. Reduce stress, remove additional weeks, or eliminate the flaw.<br /><br />" + getCraftingDetails());
        $('#divComplexityRequired').html("<span><b>Complexity still needed to complete item creation:</b> " + complexDiff + "</span>");
        $("#divComplexityRequired").addClass('alert-warning');
    }
    else {
        $("#divComplexityRequired").addClass('alert-success');
        $('#divComplexityRequired').html("<span><b>Complexity still needed to complete item creation:</b> 0</span>");
    }

    return isValid;
}
