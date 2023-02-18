const { constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { BigNumber } = require('ethers');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_UINT256 = BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935');

describe('ERC20', function () {
    var initialHolder;
    var recipient;
    var anotherAccount;
    var token;
    const name = 'My dApp Adventure Token';
    const symbol = 'DAPP';
    const initialSupply = BigNumber.from(100);

    beforeEach(async function () {
        [initialHolder, recipient, anotherAccount] = await ethers.getSigners();
        const ERC20 = await ethers.getContractFactory("MyERC20");
        token = await ERC20.deploy(name, symbol, initialSupply);
    });

    it('has a name', async function () {
        expect(await token.name()).to.equal(name);
    });

    it('has a symbol', async function () {
        expect(await token.symbol()).to.equal(symbol);
    });

    it('has 18 decimals', async function () {
        expect(await token.decimals()).to.equal(BigNumber.from('18'));
    });

    describe('decrease allowance', function () {
        describe('when the spender is not the zero address', function () {
            function shouldDecreaseApproval(amount) {
                describe('when there was no approved amount before', function () {
                    it('reverts', async function () {
                        await expect(token.decreaseAllowance(recipient.address, amount))
                            .to.be.revertedWith('ERC20: decreased allowance below zero');
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await token.approve(recipient.address, amount);
                    });

                    it('emits an approval event', async function () {
                        await expect(token.decreaseAllowance(recipient.address, amount))
                            .to.emit(token, "Approval")
                            .withArgs(initialHolder.address, recipient.address, BigNumber.from(0)); // 
                    });

                    it('decreases the spender allowance subtracting the requested amount', async function () {
                        var decreased = amount.sub(1);
                        await token.decreaseAllowance(recipient.address, decreased);

                        expect(await token.allowance(initialHolder.address, recipient.address)).to.be.equal(BigNumber.from(1));
                    });

                    it('sets the allowance to zero when all allowance is removed', async function () {
                        await token.decreaseAllowance(recipient.address, amount);
                        expect(await token.allowance(initialHolder.address, recipient.address)).to.be.equal(BigNumber.from(0));
                    });

                    it('reverts when more than the full allowance is removed', async function () {
                        await expect(
                            token.decreaseAllowance(recipient.address, amount.add(1)))
                            .to.be.revertedWith('ERC20: decreased allowance below zero');
                    });
                });
            }

            describe('when the sender has enough balance', function () {
                const amount = initialSupply;

                shouldDecreaseApproval(amount);
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.add(1);

                shouldDecreaseApproval(amount);
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = initialSupply;
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expect(
                    token.decreaseAllowance(spender, amount)).to.be.revertedWith(
                        'ERC20: decreased allowance below zero');
            });
        });
    });

    describe('increase allowance', function () {
        const amount = initialSupply;

        describe('when the spender is not the zero address', function () {
            describe('when the sender has enough balance', function () {
                it('emits an approval event', async function () {
                    await expect(token.increaseAllowance(recipient.address, amount))
                        .to.emit(token, "Approval")
                        .withArgs(initialHolder.address, recipient.address, amount); //
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await token.increaseAllowance(recipient.address, amount);
                        var allowance = await token.allowance(initialHolder.address, recipient.address);
                        expect(allowance).to.be.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await token.approve(recipient.address, BigNumber.from(1));
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await token.increaseAllowance(recipient.address, amount);

                        var allowance = await token.allowance(initialHolder.address, recipient.address);
                        expect(allowance).to.be.equal(amount.add(1));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.add(1);

                it('emits an approval event', async function () {
                    await expect(token.increaseAllowance(recipient.address, amount))
                        .to.emit(token, "Approval")
                        .withArgs(initialHolder.address, recipient.address, amount); //
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await token.increaseAllowance(recipient.address, amount);
                        var allowance = await token.allowance(initialHolder.address, recipient.address);
                        await expect(allowance).to.be.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await token.approve(recipient.address, BigNumber.from(1));
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await token.increaseAllowance(recipient.address, amount);

                        expect(await token.allowance(initialHolder.address, recipient.address)).to.be.equal(amount.add(1));
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expect(
                    token.increaseAllowance(spender, amount)).to.be.revertedWith(
                        'ERC20: approve to the zero address');
            });
        });
    });

    describe('total supply', function () {
        it('returns the total amount of tokens', async function () {
            expect(await token.totalSupply()).to.be.equal(initialSupply);
        });
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                expect(await token.balanceOf(anotherAccount.address)).to.equal(BigNumber.from('0'));
            });
        });

        describe('when the requested account has some tokens', function () {
            it('returns the total amount of tokens', async function () {
                expect(await token.balanceOf(initialHolder.address)).to.be.equal(initialSupply);
            });
        });
    });

    /*  describe('transfer', function () {
         shouldBehaveLikeERC20Transfer(token, initialHolder, recipient, initialSupply, function (from, to, value) {
             return token.transfer(to, value, { from });
         });
     });
  */
    describe('transfer from', function () {
        describe('when the token owner is not the zero address', function () {
            describe('when the recipient is not the zero address', function () {
                describe('when the spender has enough allowance', function () {
                    beforeEach(async function () {
                        await token.approve(recipient.address, initialSupply);
                    });

                    describe('when the token owner has enough balance', function () {
                        const amount = initialSupply;

                        it('transfers the requested amount', async function () {
                            await token.connect(recipient)
                                .transferFrom(initialHolder.address, anotherAccount.address, amount);

                            expect(await token.balanceOf(initialHolder.address)).to.be.equal(BigNumber.from('0'));

                            expect(await token.balanceOf(anotherAccount.address)).to.be.equal(amount);
                        });

                        it('decreases the spender allowance', async function () {
                            await token.connect(recipient).transferFrom(initialHolder.address, anotherAccount.address, amount);
                            var allowance = await token.allowance(initialHolder.address, recipient.address);
                            expect(allowance).to.be.equal(BigNumber.from('0'));
                        });

                        it('emits a transfer event', async function () {
                            await expect(token.connect(recipient)
                                .transferFrom(initialHolder.address, anotherAccount.address, amount))
                                .to.emit(token, "Transfer")
                                .withArgs(initialHolder.address, anotherAccount.address, amount);
                        });

                        it('emits an approval event', async function () {
                            await expect(token.connect(recipient)
                                .transferFrom(initialHolder.address, anotherAccount.address, amount))
                                .to.emit(token, "Approval")
                                .withArgs(initialHolder.address, recipient.address, 0);
                        });
                    });

                    describe('when the token owner does not have enough balance', function () {
                        const amount = initialSupply;

                        beforeEach('reducing balance', async function () {
                            await token.transfer(anotherAccount.address, 1);
                        });

                        it('reverts', async function () {
                            await expect(
                                token.connect(recipient).transferFrom(initialHolder.address, anotherAccount.address,
                                    amount)).to.be.revertedWith(
                                        `ERC20: transfer amount exceeds balance`);
                        });
                    });
                });

                describe('when the spender does not have enough allowance', function () {
                    const allowance = initialSupply.sub(1);

                    beforeEach(async function () {
                        await token.approve(recipient.address, allowance);
                    });

                    describe('when the token owner has enough balance', function () {
                        const amount = initialSupply;

                        it('reverts', async function () {
                            await expect(
                                token.connect(recipient).transferFrom(initialHolder.address, anotherAccount.address, amount))
                                .to.be.revertedWith(
                                    `ERC20: insufficient allowance`
                                );
                        });
                    });

                    describe('when the token owner does not have enough balance', function () {
                        const amount = allowance;

                        beforeEach('reducing balance', async function () {
                            await token.transfer(anotherAccount.address, 2);
                        });

                        it('reverts', async function () {
                            await expect(
                                token.connect(recipient).transferFrom(initialHolder.address, anotherAccount.address, amount))
                                .to.be.revertedWith(
                                    `ERC20: transfer amount exceeds balance`,
                                );
                        });
                    });
                });

                describe('when the spender has unlimited allowance', function () {
                    beforeEach(async function () {
                        await token.approve(recipient.address, MAX_UINT256);
                    });

                    it('does not decrease the spender allowance', async function () {
                        await token.connect(recipient).transferFrom(initialHolder.address, anotherAccount.address, 1);

                        expect(await token.allowance(initialHolder.address, recipient.address)).to.be.equal(MAX_UINT256);
                    });

                    it('does not emit an approval event', async function () {
                        await expect(token.connect(recipient).transferFrom(initialHolder.address,
                            anotherAccount.address, 1)).to.not.emit(token, "Approval");
                    });
                });
            });

            describe('when the recipient is the zero address', function () {
                const amount = initialSupply;
                const to = ZERO_ADDRESS;

                beforeEach(async function () {
                    await token.approve(recipient.address, amount);
                });

                it('reverts', async function () {
                    await expect(
                        token.connect(recipient).transferFrom(initialHolder.address, to, amount)).to.be.revertedWith(
                            `ERC20: transfer to the zero address`,
                        );
                });
            });
        });
    });
});
