(function ($) {
    Drupal.behaviors.be1 = {
        attach: function (context, settings) {
            // Scrie doar numere
            jQuery("table").on(
                "keypress",
                "input.float, input.numeric",
                function (event) {
                    if (isNumberPressed(this, event) === false) {
                        event.preventDefault();
                    }
                }
            );
        },
    };

    // ================================================================
    // CAP.I – helper mic pentru format coloană 2 cifre
    // ================================================================
    function col2(c) {
        return c.toString().padStart(2, "0");
    }
    function c2(c) {
        return c.toString().padStart(2, "0");
    }

    const CAP1_SKIP = new Set([
        // rând 2 & 3: col 3–6 au "x"
        "R2C3",
        "R2C4",
        "R2C5",
        "R2C6",
        "R3C3",
        "R3C4",
        "R3C5",
        "R3C6",
        // rând 9,10,11: col 7–11 au "x"
        "R9C7",
        "R9C8",
        "R9C9",
        "R9C10",
        "R9C11",
        "R10C7",
        "R10C8",
        "R10C9",
        "R10C10",
        "R10C11",
        "R11C7",
        "R11C8",
        "R11C9",
        "R11C10",
        "R11C11",
    ]);

    function hasCap1Field(r, c) {
        return !CAP1_SKIP.has(`R${r}C${c}`);
    }

    webform.afterLoad.edu1 = function () { };

    webform.validators.edu1 = function () {
        var values = Drupal.settings.mywebform.values;
        var errors = webform.errors;

        // ================================================================
        // 1) Cap.I (Rind.04) = (Rind. 05 + 08)  (Col.1–12)
        //     R4 = R5 + R8
        // ================================================================
        for (let c = 1; c <= 12; c++) {
            const cc = col2(c);

            const r4 = new Decimal(values[`CAP1_R4_C${cc}`] || 0);
            const r5 = new Decimal(values[`CAP1_R5_C${cc}`] || 0);
            const r8 = new Decimal(values[`CAP1_R8_C${cc}`] || 0);

            const rhs = r5.plus(r8);

            if (!r4.equals(rhs)) {
                webform.errors.push({
                    fieldName: `CAP1_R4_C${cc}`,
                    msg: `[01-041]. Cap.I: Rînd.04, Col.${c} (${r4}) = Rînd.05 (${r5}) + Rînd.08 (${r8}) = ${rhs}.`,
                });
            }
        }

        // ================================================================
        // 2) Cap.I (Rind.05) = (Rind. 06 + 07)  (Col.1–12)
        //     R5 = R6 + R7
        // ================================================================
        for (let c = 1; c <= 12; c++) {
            const cc = col2(c);

            const r5 = new Decimal(values[`CAP1_R5_C${cc}`] || 0);
            const r6 = new Decimal(values[`CAP1_R6_C${cc}`] || 0);
            const r7 = new Decimal(values[`CAP1_R7_C${cc}`] || 0);

            const rhs = r6.plus(r7);

            if (!r5.equals(rhs)) {
                webform.errors.push({
                    fieldName: `CAP1_R5_C${cc}`,
                    msg: `[01-051]. Cap.I: Rînd.05, Col.${c} (${r5}) = Rînd.06 (${r6}) + Rînd.07 (${r7}) = ${rhs}.`,
                });
            }
        }

        // ================================================================
        // 3) Cap.I (Rind.11) = (Rind. 01 + 04 + 09 + 10)  (Col.1–12)
        //     R11 = R1 + R4 + R9 + R10
        //     (pentru col.7–11, R9 şi R10 sunt 0, pentru că au "x")
        // ================================================================
        for (let c = 1; c <= 12; c++) {
            const cc = col2(c);

            const r11 = new Decimal(values[`CAP1_R11_C${cc}`] || 0);
            const r1 = new Decimal(values[`CAP1_R1_C${cc}`] || 0);
            const r4 = new Decimal(values[`CAP1_R4_C${cc}`] || 0);
            const r9 = new Decimal(values[`CAP1_R9_C${cc}`] || 0); // dacă nu există câmp, vine 0
            const r10 = new Decimal(values[`CAP1_R10_C${cc}`] || 0);

            const rhs = r1.plus(r4).plus(r9).plus(r10);

            if (!r11.equals(rhs)) {
                webform.errors.push({
                    fieldName: `CAP1_R11_C${cc}`,
                    msg: `[01-111]. Cap.I: Rînd.11, Col.${c} (${r11}) = Rînd.01 (${r1}) + Rînd.04 (${r4}) + Rînd.09 (${r9}) + Rînd.10 (${r10}) = ${rhs}.`,
                });
            }
        }

        // ================================================================
        // 4) Cap.I (Rind.01) ≥ (Rind. 02 + 03)  (Col.1,2,7–12)
        //     R1 >= R2 + R3
        // ================================================================
        const cap1ColsIneq = [1, 2, 7, 8, 9, 10, 11, 12];

        for (const c of cap1ColsIneq) {
            const cc = col2(c);

            const r1 = new Decimal(values[`CAP1_R1_C${cc}`] || 0);
            const r2 = new Decimal(values[`CAP1_R2_C${cc}`] || 0);
            const r3 = new Decimal(values[`CAP1_R3_C${cc}`] || 0);

            const rhs = r2.plus(r3);

            if (r1.lt(rhs)) {
                webform.errors.push({
                    fieldName: `CAP1_R1_C${cc}`,
                    msg: `[01-012]. Cap.I: Rînd.01, Col.${c} (${r1}) ≥ Rînd.02 (${r2}) + Rînd.03 (${r3}) = ${rhs}.`,
                });
            }
        }

        // Celulele care NU există (în tabel e 'x') – le omitem din validări
        const CAP1_SKIP = new Set();
        // rând 2 și 3: C3,4,5,6
        [2, 3].forEach((r) => {
            [3, 4, 5, 6].forEach((c) => CAP1_SKIP.add(`R${r}C${c}`));
        });
        // rând 9,10,11: C7–11
        [9, 10, 11].forEach((r) => {
            for (let c = 7; c <= 11; c++) CAP1_SKIP.add(`R${r}C${c}`);
        });

        function hasCap1Field(r, c) {
            return !CAP1_SKIP.has(`R${r}C${c}`);
        }

        // Helper generic pentru inegalitățile de tip:
        //   Cap.I (Col.left) ≥ (Col.right)  (Rînd.*)
        function cap1ColGeCol(colLeft, colRight, code) {
            for (let r = 1; r <= 11; r++) {
                if (!hasCap1Field(r, colLeft) || !hasCap1Field(r, colRight)) {
                    continue; // celula nu există în formular
                }

                const leftKey = `CAP1_R${r}_C${c2(colLeft)}`;
                const rightKey = `CAP1_R${r}_C${c2(colRight)}`;

                const leftVal = new Decimal(values[leftKey] || 0);
                const rightVal = new Decimal(values[rightKey] || 0);

                if (leftVal.lt(rightVal)) {
                    webform.errors.push({
                        fieldName: rightKey,
                        msg: ` [${code}]. Cap.I, Rîndul ${r}: Col.${colLeft} (${leftVal}) ≥ Col.${colRight} (${rightVal}).`,
                    });
                }
            }
        }

        // ===================================================================
        // Cap.I  (Col.1) ≥ (Col.2)  (Rînd.*)
        // ===================================================================
        cap1ColGeCol(1, 2, "01-021");

        // Cap.I  (Col.1) ≥ (Col.3)  (Rînd.*)
        cap1ColGeCol(1, 3, "01-022");

        // Cap.I  (Col.1) ≥ (Col.5)  (Rînd.*)
        cap1ColGeCol(1, 5, "01-023");

        // Cap.I  (Col.1) ≥ (Col.7)  (Rînd.*)
        cap1ColGeCol(1, 7, "01-024");

        // Cap.I  (Col.2) ≥ (Col.4)  (Rînd.*)
        cap1ColGeCol(2, 4, "01-025");

        // Cap.I  (Col.2) ≥ (Col.6)  (Rînd.*)
        cap1ColGeCol(2, 6, "01-026");

        // Cap.I  (Col.2) ≥ (Col.8)  (Rînd.*)
        cap1ColGeCol(2, 8, "01-027");

        // Col.left ≥ Σ(colRight[])
        function cap1ColGeSum(colLeft, colsRight, code) {
            for (let r = 1; r <= 11; r++) {
                // Dacă vreo coloană nu există pe rândul acesta (în tabel era "x"), sărim
                if (!hasCap1Field(r, colLeft)) continue;
                if (!colsRight.every((c) => hasCap1Field(r, c))) continue;

                const leftKey = `CAP1_R${r}_C${c2(colLeft)}`;
                const leftVal = new Decimal(values[leftKey] || 0);

                let sum = new Decimal(0);
                for (const c of colsRight) {
                    const key = `CAP1_R${r}_C${c2(c)}`;
                    sum = sum.plus(new Decimal(values[key] || 0));
                }

                if (leftVal.lt(sum)) {
                    webform.errors.push({
                        fieldName: leftKey,
                        msg: ` [${code}]. Cap.I, Rîndul ${r}: Col.${colLeft} (${leftVal}) ≥ Σ(Col.${colsRight.join(
                            ","
                        )}) = ${sum}.`,
                    });
                }
            }
        }

        // Col.left = Σ(colRight[])
        function cap1ColEqSum(colLeft, colsRight, code) {
            for (let r = 1; r <= 11; r++) {
                if (!hasCap1Field(r, colLeft)) continue;
                if (!colsRight.every((c) => hasCap1Field(r, c))) continue;

                const leftKey = `CAP1_R${r}_C${c2(colLeft)}`;
                const leftVal = new Decimal(values[leftKey] || 0);

                let sum = new Decimal(0);
                for (const c of colsRight) {
                    const key = `CAP1_R${r}_C${c2(c)}`;
                    sum = sum.plus(new Decimal(values[key] || 0));
                }

                if (!leftVal.equals(sum)) {
                    webform.errors.push({
                        fieldName: leftKey,
                        msg: ` [${code}]. Cap.I, Rîndul ${r}: Col.${colLeft} (${leftVal}) = Σ(Col.${colsRight.join(
                            ","
                        )}) = ${sum}.`,
                    });
                }
            }
        }

        // Cap.I  (Col.1) ≥ ∑ (Col.9,10,11) (Rînd.*)
        cap1ColGeSum(1, [9, 10, 11], "01-031");

        // Cap.I  (Col.1) = ∑ (Col.3,5)  (Rînd.*)
        cap1ColEqSum(1, [3, 5], "01-032");

        // Cap.I  (Col.2) = ∑ (Col.4,6)  (Rînd.*)
        cap1ColEqSum(2, [4, 6], "01-033");

        // Cap.I  (Col.7) ≥ ∑ (Col.9,10,11) (Rînd.*)
        cap1ColGeSum(7, [9, 10, 11], "01-034");

        webform.validatorsStatus["edu1"] = 1;
        validateWebform();
    };
})(jQuery);
