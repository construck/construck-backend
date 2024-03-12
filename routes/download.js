const router = require("express").Router();
const workData = require("../models/workData");
const _ = require("lodash");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;

router.get("/dailyworks/all", async (req, res) => {
  //download/dailyworks/all
  const ids = [
    new mongoose.Types.ObjectId("65b8ddc21c9b7be20c19dcf0"),
    new mongoose.Types.ObjectId("65cb30e7eee78bb64c407701"),
    new mongoose.Types.ObjectId("65d48845ba88a7a7975447f0"),
    new mongoose.Types.ObjectId("65b7bc3aa385090d9df7a366"),
    new mongoose.Types.ObjectId("65ba0ad1e2b45a8e42ce0baf"),
    new mongoose.Types.ObjectId("65ba5330c18c2ba85b988070"),
    new mongoose.Types.ObjectId("65bb8dd37f9790b68f0f82f2"),
    new mongoose.Types.ObjectId("65c0dbc30b51ccdc2644c012"),
    new mongoose.Types.ObjectId("65c9d8ca53e2420591c3f00e"),
    new mongoose.Types.ObjectId("65d49c42ba88a7a7976d089e"),
    new mongoose.Types.ObjectId("65b79f6696e704d97457de48"),
    new mongoose.Types.ObjectId("65cb31b3eee78bb64c4081a1"),
    new mongoose.Types.ObjectId("65d3268105ece71036781f57"),
    new mongoose.Types.ObjectId("65ae9d38d1135558ebc8a27a"),
    new mongoose.Types.ObjectId("65b1227feeaeac2c197afb2b"),
    new mongoose.Types.ObjectId("65cb3036eee78bb64c3df759"),
    new mongoose.Types.ObjectId("65d492a0ba88a7a7975eb76d"),
    new mongoose.Types.ObjectId("65ae42f8d1135558eb6f9946"),
    new mongoose.Types.ObjectId("65ae16ded1135558eb55e352"),
    new mongoose.Types.ObjectId("65c3911b265855a05003dd3d"),
    new mongoose.Types.ObjectId("65d490c6ba88a7a7975995dd"),
    new mongoose.Types.ObjectId("65d4916fba88a7a79759a587"),
    new mongoose.Types.ObjectId("65ae3b41d1135558eb6ba6b6"),
    new mongoose.Types.ObjectId("65afae7176edf84139c2ac7b"),
    new mongoose.Types.ObjectId("65b3a2b71bf6d55bb46a450d"),
    new mongoose.Types.ObjectId("65c38c3d4a15b64735d893be"),
    new mongoose.Types.ObjectId("65cb2feeeee78bb64c3df198"),
    new mongoose.Types.ObjectId("65ccd4b2eb34db1f20ddde84"),
    new mongoose.Types.ObjectId("65a91ace7b98e8ecbef3d7e6"),
    new mongoose.Types.ObjectId("65a91b1d7b98e8ecbef507c8"),
    new mongoose.Types.ObjectId("65ae15fdd1135558eb55dc02"),
    new mongoose.Types.ObjectId("65afae2676edf84139c17b3e"),
    new mongoose.Types.ObjectId("65afadde76edf84139c17849"),
    new mongoose.Types.ObjectId("65ccabc1eb34db1f20b41982"),
    new mongoose.Types.ObjectId("65d6fe171fe6093d0d360988"),
    new mongoose.Types.ObjectId("65a90a9b7b98e8ecbeeb13b6"),
    new mongoose.Types.ObjectId("65a90ce17b98e8ecbeec5482"),
    new mongoose.Types.ObjectId("65b773eb1ceabfb6128daab4"),
    new mongoose.Types.ObjectId("65b8bd5293f04c9985ce6e28"),
    new mongoose.Types.ObjectId("65c39312265855a050051982"),
    new mongoose.Types.ObjectId("6596b49b6881f36a3c208830"),
    new mongoose.Types.ObjectId("65a91dac7b98e8ecbef773d7"),
    new mongoose.Types.ObjectId("65a920a57b98e8ecbefd57e8"),
    new mongoose.Types.ObjectId("65a940987b98e8ecbe25efaa"),
    new mongoose.Types.ObjectId("65a93d7a7b98e8ecbe24a3ee"),
    new mongoose.Types.ObjectId("65a93d7a7b98e8ecbe24a3f0"),
    new mongoose.Types.ObjectId("65a93d7a7b98e8ecbe24a3f2"),
    new mongoose.Types.ObjectId("65ae3cb5d1135558eb6bbc6c"),
    new mongoose.Types.ObjectId("65aa844b4b8e7f1e858f8501"),
    new mongoose.Types.ObjectId("65cb3065eee78bb64c3f3796"),
    new mongoose.Types.ObjectId("65a53595c5e259a6b3c6ea0f"),
    new mongoose.Types.ObjectId("65a788e3f52d94d1b76250d0"),
    new mongoose.Types.ObjectId("65a788e3f52d94d1b76250d2"),
    new mongoose.Types.ObjectId("65c38e904a15b64735d89931"),
    new mongoose.Types.ObjectId("65cb30a9eee78bb64c407448"),
    new mongoose.Types.ObjectId("65ccd54ceb34db1f20dde183"),
    new mongoose.Types.ObjectId("65a4f444c5e259a6b36d9003"),
    new mongoose.Types.ObjectId("65a4f444c5e259a6b36d9001"),
    new mongoose.Types.ObjectId("65a4e26cc5e259a6b35233c3"),
    new mongoose.Types.ObjectId("65a7cce3f52d94d1b7a1e745"),
    new mongoose.Types.ObjectId("65a13759b53387e7bfdf5929"),
    new mongoose.Types.ObjectId("65a4eb53c5e259a6b3606439"),
    new mongoose.Types.ObjectId("65c38b8a4a15b64735d88ff3"),
    new mongoose.Types.ObjectId("65ccd463eb34db1f20dca14f"),
    new mongoose.Types.ObjectId("65d49981ba88a7a7976a4af3"),
    new mongoose.Types.ObjectId("65d5d79b8c0b27c4deff3ca2"),
    new mongoose.Types.ObjectId("65a0f6f9b53387e7bfad4abb"),
    new mongoose.Types.ObjectId("65a4eabdc5e259a6b3605e4a"),
    new mongoose.Types.ObjectId("65cb5e58eee78bb64c657431"),
    new mongoose.Types.ObjectId("65966c6b6881f36a3ce14004"),
    new mongoose.Types.ObjectId("65a0f696b53387e7bfad48c6"),
    new mongoose.Types.ObjectId("65a136e8b53387e7bfdf5210"),
    new mongoose.Types.ObjectId("65a136e8b53387e7bfdf5212"),
    new mongoose.Types.ObjectId("65a136e8b53387e7bfdf5214"),
    new mongoose.Types.ObjectId("65a0f696b53387e7bfad48c8"),
    new mongoose.Types.ObjectId("65a4eb03c5e259a6b3606155"),
    new mongoose.Types.ObjectId("65a55df6c5e259a6b30756fe"),
    new mongoose.Types.ObjectId("65a0f5a8b53387e7bfac19b0"),
    new mongoose.Types.ObjectId("65a0f5a8b53387e7bfac19b4"),
    new mongoose.Types.ObjectId("65a0f5a8b53387e7bfac19b2"),
    new mongoose.Types.ObjectId("65a5109ec5e259a6b3789b16"),
    new mongoose.Types.ObjectId("65c38e3c4a15b64735d89755"),
    new mongoose.Types.ObjectId("65c38fae4a15b64735dd872e"),
    new mongoose.Types.ObjectId("65ccd504eb34db1f20dddfb7"),
    new mongoose.Types.ObjectId("65ccd6dbeb34db1f20e2e2a6"),
    new mongoose.Types.ObjectId("65d4543f05ece710368cd5e8"),
    new mongoose.Types.ObjectId("659e6cf4bd4ebf87a853b8b3"),
    new mongoose.Types.ObjectId("65a124e5b53387e7bfceff0f"),
    new mongoose.Types.ObjectId("659eba73bd4ebf87a896b411"),
    new mongoose.Types.ObjectId("65d4463405ece71036821151"),
    new mongoose.Types.ObjectId("659e6397bd4ebf87a85019f4"),
    new mongoose.Types.ObjectId("65bb9c507f9790b68f14a455"),
    new mongoose.Types.ObjectId("659e77a7bd4ebf87a8576553"),
    new mongoose.Types.ObjectId("65c234b8012424fd012f3929"),
    new mongoose.Types.ObjectId("65cb4133eee78bb64c5269e5"),
    new mongoose.Types.ObjectId("65ccd744eb34db1f20e2e586"),
    new mongoose.Types.ObjectId("65951172dd08de45e414e1f0"),
    new mongoose.Types.ObjectId("659d456b2cb8892549e9ef6d"),
    new mongoose.Types.ObjectId("65b8b4de93f04c9985c70a0a"),
    new mongoose.Types.ObjectId("65b8b57493f04c9985c70d88"),
    new mongoose.Types.ObjectId("65b8b57493f04c9985c70d8a"),
    new mongoose.Types.ObjectId("65c38f5c4a15b64735dc4b54"),
    new mongoose.Types.ObjectId("65ccd635eb34db1f20e05c94"),
    new mongoose.Types.ObjectId("65a646bd048fae52d253ebce"),
    new mongoose.Types.ObjectId("65cb3143eee78bb64c407b7d"),
    new mongoose.Types.ObjectId("65cb31f1eee78bb64c4434b4"),
    new mongoose.Types.ObjectId("65ccd269eb34db1f20da1e97"),
    new mongoose.Types.ObjectId("65ccd35eeb34db1f20db618d"),
    new mongoose.Types.ObjectId("65d495f5ba88a7a79763d7ab"),
    new mongoose.Types.ObjectId("6593f21bdf3f7ded8daa6aa3"),
    new mongoose.Types.ObjectId("659eb7c6bd4ebf87a890ce24"),
    new mongoose.Types.ObjectId("659eb99abd4ebf87a8932ae6"),
    new mongoose.Types.ObjectId("65bb8f027f9790b68f10ba58"),
    new mongoose.Types.ObjectId("65ca0f6553e2420591f630f3"),
    new mongoose.Types.ObjectId("65ca13a753e2420591f6672b"),
    new mongoose.Types.ObjectId("65d3590005ece71036ae7349"),
    new mongoose.Types.ObjectId("65df39795dbc1bf4690e26fa"),
    new mongoose.Types.ObjectId("6597b5cfc68f1c44ee71e81e"),
    new mongoose.Types.ObjectId("659bd7761ea237ad38f4970d"),
    new mongoose.Types.ObjectId("659e90f2bd4ebf87a86b111d"),
    new mongoose.Types.ObjectId("65a51709c5e259a6b38b9ca7"),
    new mongoose.Types.ObjectId("65a4f0a0c5e259a6b369e997"),
    new mongoose.Types.ObjectId("65c38b3b4a15b64735d7546c"),
    new mongoose.Types.ObjectId("65c9d9c853e2420591c7a64a"),
    new mongoose.Types.ObjectId("65cb40f4eee78bb64c51285c"),
    new mongoose.Types.ObjectId("65ccd411eb34db1f20db6405"),
    new mongoose.Types.ObjectId("65d34f0e05ece71036a19423"),
    new mongoose.Types.ObjectId("65d4590405ece710368e438c"),
    new mongoose.Types.ObjectId("65d48f43ba88a7a797598be6"),
    new mongoose.Types.ObjectId("6593c762df3f7ded8d86a4d0"),
    new mongoose.Types.ObjectId("6593c762df3f7ded8d86a4d2"),
    new mongoose.Types.ObjectId("6593c639df3f7ded8d86a30e"),
    new mongoose.Types.ObjectId("6593c762df3f7ded8d86a4cc"),
    new mongoose.Types.ObjectId("6593c762df3f7ded8d86a4ce"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88eca4"),
    new mongoose.Types.ObjectId("6593c7b5df3f7ded8d86a6b9"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88ecae"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88ecac"),
    new mongoose.Types.ObjectId("6593ca9adf3f7ded8d88ed03"),
    new mongoose.Types.ObjectId("6593ca9adf3f7ded8d88ed05"),
    new mongoose.Types.ObjectId("6594160adf3f7ded8dcb92cd"),
    new mongoose.Types.ObjectId("6594160ddf3f7ded8dcb931b"),
    new mongoose.Types.ObjectId("65941649df3f7ded8dcb9525"),
    new mongoose.Types.ObjectId("65941c8edf3f7ded8dd14dda"),
    new mongoose.Types.ObjectId("65941dcddf3f7ded8dd2727a"),
    new mongoose.Types.ObjectId("65941dcddf3f7ded8dd2727c"),
    new mongoose.Types.ObjectId("6594234adf3f7ded8dd703c2"),
    new mongoose.Types.ObjectId("6595172add08de45e422aa4d"),
    new mongoose.Types.ObjectId("65951b88dd08de45e42c0e28"),
    new mongoose.Types.ObjectId("65951ff3dd08de45e42f9391"),
    new mongoose.Types.ObjectId("65952067dd08de45e42f95e1"),
    new mongoose.Types.ObjectId("659525efdd08de45e43322ca"),
    new mongoose.Types.ObjectId("659554fddd08de45e4764d34"),
    new mongoose.Types.ObjectId("659555a5dd08de45e479ba34"),
    new mongoose.Types.ObjectId("65955a0fdd08de45e4853621"),
    new mongoose.Types.ObjectId("65955a0fdd08de45e4853627"),
    new mongoose.Types.ObjectId("65956b07dd08de45e4c715a0"),
    new mongoose.Types.ObjectId("65956b0bdd08de45e4c715eb"),
    new mongoose.Types.ObjectId("65956b0bdd08de45e4c715ed"),
    new mongoose.Types.ObjectId("65956c03dd08de45e4ca8774"),
    new mongoose.Types.ObjectId("65957348dd08de45e4d16dcc"),
    new mongoose.Types.ObjectId("6595758fdd08de45e4dab323"),
    new mongoose.Types.ObjectId("6593c7b5df3f7ded8d86a6b7"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88ecb6"),
    new mongoose.Types.ObjectId("6593ca9adf3f7ded8d88ed0f"),
    new mongoose.Types.ObjectId("6593fc37df3f7ded8dadda79"),
    new mongoose.Types.ObjectId("6594160ddf3f7ded8dcb931f"),
    new mongoose.Types.ObjectId("65941d34df3f7ded8dd14fa3"),
    new mongoose.Types.ObjectId("65941e0edf3f7ded8dd27455"),
    new mongoose.Types.ObjectId("65941ea2df3f7ded8dd2773f"),
    new mongoose.Types.ObjectId("65941edfdf3f7ded8dd27909"),
    new mongoose.Types.ObjectId("6594234adf3f7ded8dd703c0"),
    new mongoose.Types.ObjectId("65951380dd08de45e4197701"),
    new mongoose.Types.ObjectId("65951955dd08de45e42510b7"),
    new mongoose.Types.ObjectId("65951955dd08de45e42510bb"),
    new mongoose.Types.ObjectId("65951b88dd08de45e42c0e24"),
    new mongoose.Types.ObjectId("65951b88dd08de45e42c0e2a"),
    new mongoose.Types.ObjectId("65952067dd08de45e42f95e3"),
    new mongoose.Types.ObjectId("6595225cdd08de45e431eeb8"),
    new mongoose.Types.ObjectId("6595225cdd08de45e431eeba"),
    new mongoose.Types.ObjectId("659525efdd08de45e43322cc"),
    new mongoose.Types.ObjectId("65952e46dd08de45e44b3342"),
    new mongoose.Types.ObjectId("659554fddd08de45e4764d36"),
    new mongoose.Types.ObjectId("659554fedd08de45e4764d46"),
    new mongoose.Types.ObjectId("659554fedd08de45e4764d44"),
    new mongoose.Types.ObjectId("65955caddd08de45e4954a74"),
    new mongoose.Types.ObjectId("659568c4dd08de45e4bf1da3"),
    new mongoose.Types.ObjectId("65956b07dd08de45e4c7159e"),
    new mongoose.Types.ObjectId("65956b0bdd08de45e4c715ef"),
    new mongoose.Types.ObjectId("65956b0bdd08de45e4c715f1"),
    new mongoose.Types.ObjectId("659576eedd08de45e4de4689"),
    new mongoose.Types.ObjectId("65957c21dd08de45e4ef8694"),
    new mongoose.Types.ObjectId("65958ba96881f36a3c71904e"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88ecaa"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88eca6"),
    new mongoose.Types.ObjectId("6593ca96df3f7ded8d88eca8"),
    new mongoose.Types.ObjectId("6593ca9adf3f7ded8d88ed01"),
    new mongoose.Types.ObjectId("6593ca9adf3f7ded8d88ecff"),
    new mongoose.Types.ObjectId("6593ca9adf3f7ded8d88ed07"),
    new mongoose.Types.ObjectId("6593f270df3f7ded8daa6cfa"),
    new mongoose.Types.ObjectId("6593fbd0df3f7ded8dadd8b4"),
    new mongoose.Types.ObjectId("6594160adf3f7ded8dcb92d1"),
    new mongoose.Types.ObjectId("6594160adf3f7ded8dcb92d8"),
    new mongoose.Types.ObjectId("6594160adf3f7ded8dcb92d6"),
    new mongoose.Types.ObjectId("6594160adf3f7ded8dcb92da"),
    new mongoose.Types.ObjectId("6594160ddf3f7ded8dcb931d"),
    new mongoose.Types.ObjectId("659416c8df3f7ded8dccbb93"),
    new mongoose.Types.ObjectId("65941dcddf3f7ded8dd27284"),
    new mongoose.Types.ObjectId("659422c1df3f7ded8dd70194"),
    new mongoose.Types.ObjectId("659518c2dd08de45e4250d07"),
    new mongoose.Types.ObjectId("65951955dd08de45e42510b9"),
    new mongoose.Types.ObjectId("65951ff3dd08de45e42f938b"),
    new mongoose.Types.ObjectId("65951ff3dd08de45e42f938f"),
    new mongoose.Types.ObjectId("65951ff3dd08de45e42f9389"),
    new mongoose.Types.ObjectId("65951ff3dd08de45e42f938d"),
    new mongoose.Types.ObjectId("6595211edd08de45e430bba4"),
    new mongoose.Types.ObjectId("659525efdd08de45e43322ce"),
    new mongoose.Types.ObjectId("65952a2fdd08de45e43fb282"),
    new mongoose.Types.ObjectId("65952e46dd08de45e44b3344"),
    new mongoose.Types.ObjectId("65952e46dd08de45e44b3346"),
    new mongoose.Types.ObjectId("659554fddd08de45e4764d38"),
    new mongoose.Types.ObjectId("659555a5dd08de45e479ba32"),
    new mongoose.Types.ObjectId("659555a5dd08de45e479ba3a"),
    new mongoose.Types.ObjectId("65955a0fdd08de45e485361f"),
    new mongoose.Types.ObjectId("65957348dd08de45e4d16dca"),
    new mongoose.Types.ObjectId("659576eedd08de45e4de4683"),
    new mongoose.Types.ObjectId("65957c50dd08de45e4ef8918"),
    new mongoose.Types.ObjectId("6593fc37df3f7ded8dadda77"),
    new mongoose.Types.ObjectId("659400d1df3f7ded8db28e8f"),
    new mongoose.Types.ObjectId("659400d1df3f7ded8db28e8d"),
    new mongoose.Types.ObjectId("6594160adf3f7ded8dcb92cf"),
    new mongoose.Types.ObjectId("65941d34df3f7ded8dd14f9d"),
    new mongoose.Types.ObjectId("65941d34df3f7ded8dd14f9f"),
    new mongoose.Types.ObjectId("65941d34df3f7ded8dd14fa1"),
    new mongoose.Types.ObjectId("659422c1df3f7ded8dd70198"),
    new mongoose.Types.ObjectId("659422c1df3f7ded8dd70196"),
    new mongoose.Types.ObjectId("6594234adf3f7ded8dd703be"),
    new mongoose.Types.ObjectId("65951036dd08de45e414da22"),
    new mongoose.Types.ObjectId("659510efdd08de45e414dfa9"),
    new mongoose.Types.ObjectId("6595155cdd08de45e4216e72"),
    new mongoose.Types.ObjectId("65951653dd08de45e422a3d1"),
    new mongoose.Types.ObjectId("6595175fdd08de45e422ac41"),
    new mongoose.Types.ObjectId("65951955dd08de45e42510b5"),
    new mongoose.Types.ObjectId("65951a3cdd08de45e4264c8f"),
    new mongoose.Types.ObjectId("65951b88dd08de45e42c0e26"),
    new mongoose.Types.ObjectId("65951e2bdd08de45e42e6d19"),
    new mongoose.Types.ObjectId("65951ff3dd08de45e42f9387"),
    new mongoose.Types.ObjectId("6595211edd08de45e430bba2"),
    new mongoose.Types.ObjectId("6595321edd08de45e44c7cee"),
    new mongoose.Types.ObjectId("6595321edd08de45e44c7cf0"),
    new mongoose.Types.ObjectId("65955a0fdd08de45e4853623"),
    new mongoose.Types.ObjectId("65955a0fdd08de45e4853625"),
    new mongoose.Types.ObjectId("65955a87dd08de45e488a818"),
    new mongoose.Types.ObjectId("65956b07dd08de45e4c715a2"),
    new mongoose.Types.ObjectId("65956b07dd08de45e4c715a6"),
    new mongoose.Types.ObjectId("65956b07dd08de45e4c715a4"),
    new mongoose.Types.ObjectId("65956b07dd08de45e4c715a8"),
    new mongoose.Types.ObjectId("65957348dd08de45e4d16dce"),
    new mongoose.Types.ObjectId("6595758fdd08de45e4dab321"),
    new mongoose.Types.ObjectId("65958ba96881f36a3c719050"),
    new mongoose.Types.ObjectId("65958ba96881f36a3c71904c"),
    new mongoose.Types.ObjectId("65958ba96881f36a3c719052"),
    new mongoose.Types.ObjectId("65957631dd08de45e4dbebde"),
    new mongoose.Types.ObjectId("659576eedd08de45e4de4685"),
    new mongoose.Types.ObjectId("659576eedd08de45e4de4687"),
    new mongoose.Types.ObjectId("65957bf2dd08de45e4ef83df"),
    new mongoose.Types.ObjectId("6597b7fec68f1c44ee71f10d"),
    new mongoose.Types.ObjectId("65966c256881f36a3ce01c0e"),
    new mongoose.Types.ObjectId("65991a9ccd26b6379033bda3"),
    new mongoose.Types.ObjectId("659d74472cb8892549167da2"),
    new mongoose.Types.ObjectId("659e6ac1bd4ebf87a8515c7f"),
    new mongoose.Types.ObjectId("659e6ac1bd4ebf87a8515c81"),
    new mongoose.Types.ObjectId("659e769cbd4ebf87a8575f20"),
    new mongoose.Types.ObjectId("659ffb5b6546fbe122c3ac5e"),
    new mongoose.Types.ObjectId("65a10d01b53387e7bfbce4ea"),
    new mongoose.Types.ObjectId("659e7740bd4ebf87a8576257"),
    new mongoose.Types.ObjectId("659e9094bd4ebf87a869e61c"),
    new mongoose.Types.ObjectId("659e9193bd4ebf87a86c3d0a"),
    new mongoose.Types.ObjectId("659e6379bd4ebf87a85018b8"),
    new mongoose.Types.ObjectId("659e6ac1bd4ebf87a8515c7d"),
    new mongoose.Types.ObjectId("659e7ad5bd4ebf87a8589b53"),
    new mongoose.Types.ObjectId("659eaf7fbd4ebf87a87e27d8"),
    new mongoose.Types.ObjectId("65a10c6bb53387e7bfbce1ac"),
    new mongoose.Types.ObjectId("65a12e3fb53387e7bfd63d38"),
    new mongoose.Types.ObjectId("65a138cbb53387e7bfdf6595"),
    new mongoose.Types.ObjectId("65a51656c5e259a6b3893683"),
    new mongoose.Types.ObjectId("65a51122c5e259a6b3789c76"),
    new mongoose.Types.ObjectId("65a67d99048fae52d2729556"),
    new mongoose.Types.ObjectId("65a79433f52d94d1b76d6143"),
    new mongoose.Types.ObjectId("65aa2ca74b8e7f1e855ca3ac"),
    new mongoose.Types.ObjectId("65ae2a2dd1135558eb6118fb"),
    new mongoose.Types.ObjectId("65ae2ac2d1135558eb611be5"),
    new mongoose.Types.ObjectId("65b8b49593f04c9985c6e0c1"),
    new mongoose.Types.ObjectId("65b8b49593f04c9985c6e0c3"),
    new mongoose.Types.ObjectId("65b8b51f93f04c9985c70bca"),
    new mongoose.Types.ObjectId("65ba513ac18c2ba85b960a98"),
    new mongoose.Types.ObjectId("65ba5366c18c2ba85b99b71f"),
    new mongoose.Types.ObjectId("65c23435012424fd012f359a"),
    new mongoose.Types.ObjectId("65c2373d012424fd013419ab"),
    new mongoose.Types.ObjectId("65c35afe4a15b647359ce6c8"),
    new mongoose.Types.ObjectId("65c38a9c4a15b64735d12f74"),
    new mongoose.Types.ObjectId("65c9d00453e2420591bac883"),
    new mongoose.Types.ObjectId("65c9d40953e2420591be9fa6"),
    new mongoose.Types.ObjectId("65c9db8653e2420591c7af44"),
    new mongoose.Types.ObjectId("65ca1aa653e2420591fcc6f0"),
    new mongoose.Types.ObjectId("65cb1ba7eee78bb64c2d3ee0"),
    new mongoose.Types.ObjectId("65cb40a7eee78bb64c512518"),
    new mongoose.Types.ObjectId("65cb4426eee78bb64c54fe38"),
    new mongoose.Types.ObjectId("65cc7a87eb34db1f2097c222"),
    new mongoose.Types.ObjectId("65cc7f29eb34db1f209cc4e4"),
    new mongoose.Types.ObjectId("65ccc928eb34db1f20cffe03"),
    new mongoose.Types.ObjectId("65d35a0305ece71036b3750e"),
    new mongoose.Types.ObjectId("65d35b5405ece71036b5f7a8"),
    new mongoose.Types.ObjectId("65d4433005ece7103677f0e6"),
    new mongoose.Types.ObjectId("65d4653905ece710369b3062"),
    new mongoose.Types.ObjectId("65d47c9605ece71036a869bb"),
    new mongoose.Types.ObjectId("65d47ea2ba88a7a79749ea82"),
    new mongoose.Types.ObjectId("65d4815dba88a7a797519bf8"),
    new mongoose.Types.ObjectId("65d4a3b02032c0e721ac297e"),
    new mongoose.Types.ObjectId("65d650636dab37eb9efe8b2a"),
  ];
  // 1. GET ALL SITE WORKS IN JANUARY
  const works = await workData.model.find(
    {
      _id: { $in: [new mongoose.Types.ObjectId("65b8ddc21c9b7be20c19dcf0")] },
      siteWork: true,
      workStartDate: {
        $gte: new Date("Sun, 01 Jan 2023 00:00:00 GMT"),
      },
      workEndDate: {
        $lte: new Date("Wed, 31 Jan 2024 00:00:00 GMT"),
      },
    }
    // { $set: { totalRevenue: 0 } }
  );

  // 2. GET ALL SITE WORKS THAT HAS DURATION 0

  const current = works;
  console.log("current", works[0]);
  works.map(async (work) => {
    const d =
      work?.dailyWork &&
      work?.dailyWork.map(async (d) => {
        let totalRevenue = 0;
        let totalExpenditure = 0;
        if (
          d.duration === 0 &&
          (d.totalRevenue > 0 || d.totalExpenditure > 0)
        ) {
          totalRevenue = 0;
          totalExpenditure = 0;
          d.totalRevenue = totalRevenue;
          d.totalExpenditure = totalExpenditure;
          console.log("@@@@dispatch", d);
          // await workData.model.updateOne(
          //   { _id: 1 },
          //   {
          //     $set: {
          //       totalRevenue: 0,
          //       totalExpenditure: 0,
          //     },
          //   }
          // );
        }
        return;
      });
    // return res.send({
    //   d,
    // });
    // await d.save();
  });

  return;
  // 3. UPDATE TOTALREVENUE AND TOTALEXPENDITURE IF DURATION IS 0
  return res.send({ count: works.length, works });
  return;
  //   return res.send(works);
});

router.get("/dispatches", async (req, res) => {
  try {
    const querySiteWorks = {
      siteWork: true,
      workStartDate: { $lte: "2024-01-01" },
      workEndDate: { $gte: "2024-01-31" },
    };
    const queryOthers = {
      siteWork: false,
      // "dispatch.date": {
      //     $gte: "2024-01-01",
      //     $lte: "2024-01-31",
      // },
    };
    const responseSiteWorks = await workData.model.find(querySiteWorks);
    // console.log('responseSiteWorks: ', responseSiteWorks.length);
    const responseOthers = await workData.model.find(queryOthers);
    console.log("responseOthers: ", responseOthers.length);
    let dailyWorkData = [];
    responseSiteWorks.map((r) => {
      r.dailyWork &&
        r.dailyWork.map((d) => {
          console.log("###", d);
          dailyWorkData.push({
            id: r._id,
            "Dispatch date": moment(Date.parse(d.date)).format("YYYY-MM-DD"),
            "Posted On": moment(Date.parse(d.date)).format("YYYY-MM-DD"),
            "Work dates": `${moment(r.workStartDate).format(
              "YYYY-MM-DD"
            )} - ${moment(r.workEndDate).format("YYYY-MM-DD")}`,
            "Dispatch Shift": r.dispatch.shift === "nightShift" ? "N" : "D",
            "Site work": true,
            "Project Description": r.project.prjDescription,
            "Equipment Plate number": r.equipment.plateNumber,
            "Equipment Type": r.equipment?.eqDescription,
            "Unit of measurement": r.equipment?.uom,
            "Duration (HRS)": d.uom === "hour" ? d.duration : "",
            "Duration (DAYS)": d.uom === "day" ? d.duration : "",
            "Work done": r?.workDone ? r?.workDone?.jobDescription : "Others",
            "Other work description": r.dispatch?.otherJobType,
            "Projected Revenue":
              d.equipment?.uom === "hour"
                ? d.equipment?.rate * 5
                : d.equipment?.rate, // TIERRY SHOULD DOUBLE CHECK
            "Duration(Daily work)": d.duration,
            "Daily work Revenue": d.totalRevenue,
            "Vendor payment": 0,

            "Driver Names":
              r.driver && r.driver !== null
                ? r?.driver[0]?.firstName + " " + r?.driver[0]?.lastName
                : r.equipment?.eqOwner,
            // "Turn boy 1":
            //     w?.turnBoy?.length >= 1 ? w?.turnBoy[0]?.firstName + " " + w?.turnBoy[0]?.lastName : "",
            // "Turn boy 2":
            //     w?.turnBoy?.length >= 2 ? w?.turnBoy[1]?.firstName + " " + w?.turnBoy[1]?.lastName : "",
            // "Turn boy 3":
            //     w?.turnBoy?.length >= 3 ? w?.turnBoy[2]?.firstName + " " + w?.turnBoy[2]?.lastName : "",
            // "Turn boy 4":
            //     w?.turnBoy?.length >= 4 ? w?.turnBoy[3]?.firstName + " " + w?.turnBoy[3]?.lastName : "",
            "Driver contacts": r.driver?.phone ? r.driver?.phone : " ",
            // "Target trips": r.dispatch?.targetTrips ? r.dispatch?.targetTrips : 0,
            "Trips done": r.tripsDone || "",
            // "Driver's/Operator's Comment": dNP.comment
            //     ? dNP.comment + " - " + (dNP.moreComment ? dNP.moreComment : "")
            //     : " ",
            Customer: r.project?.customer,
            Status: r.status,
            // "Project Admin": (w.projectAdmin?.firstName || "") + " " + (w.projectAdmin?.lastName || ""),
            "Start index": d?.startIndex || 0,
            "End index": d?.endIndex || 0,
          });
        });
    });

    let others = responseOthers.map((r) => {
      return {
        id: r._id,
        "Dispatch date": moment(Date.parse(r.workStartDate)).format(
          "YYYY-MM-DD"
        ),
        "Posted On": "",
        "Work dates": `${moment(r.workStartDate).format(
          "YYYY-MM-DD"
        )} - ${moment(r.workEndDate).format("YYYY-MM-DD")}`,
        "Dispatch Shift": r.dispatch.shift === "nightShift" ? "N" : "D",
        "Site work": false,
        "Project Description": r.project.prjDescription,
        "Equipment Plate number": r?.equipment?.plateNumber,
        "Equipment Type": r.equipment?.eqDescription,
        "Unit of measurement": r.equipment?.uom,
        "Duration (HRS)": r.uom === "hour" ? r.duration / (60 * 60 * 1000) : "",
        "Duration (DAYS)": r.uom === "day" ? r.duration : "",
        "Work done": "",
        "Other work description": "",
        "Projected Revenue": r.projectedRevenue,
        "Duration(Daily work)": "",
        "Daily work Revenue": r.totalRevenue,
        "Vendor payment": "",
        "Driver Names":
          r.driver && r.driver !== null
            ? r?.driver?.firstName + " " + r?.driver?.lastName
            : r.equipment?.eqOwner,
        // "Turn boy 1":
        //     w?.turnBoy?.length >= 1 ? w?.turnBoy[0]?.firstName + " " + w?.turnBoy[0]?.lastName : "",
        // "Turn boy 2":
        //     w?.turnBoy?.length >= 2 ? w?.turnBoy[1]?.firstName + " " + w?.turnBoy[1]?.lastName : "",
        // "Turn boy 3":
        //     w?.turnBoy?.length >= 3 ? w?.turnBoy[2]?.firstName + " " + w?.turnBoy[2]?.lastName : "",
        // "Turn boy 4":
        //     w?.turnBoy?.length >= 4 ? w?.turnBoy[3]?.firstName + " " + w?.turnBoy[3]?.lastName : "",
        "Driver contacts": r.driver && r.driver !== null ? r.driver.phone : " ",
        // "Target trips": r.dispatch?.targetTrips ? r.dispatch?.targetTrips : 0,
        "Trips done": r.tripsDone || "",
        // "Driver's/Operator's Comment": dNP.comment
        //     ? dNP.comment + " - " + (dNP.moreComment ? dNP.moreComment : "")
        //     : " ",
        Customer: "",
        Status: r.status,
        // "Project Admin": (w.projectAdmin?.firstName || "") + " " + (w.projectAdmin?.lastName || ""),
        "Start index": r?.startIndex || 0,
        "End index": r?.endIndex || 0,
      };
    });

    const combined = [...dailyWorkData, ...others];
    // console.log("###", combined.length);
    return res.status(200).send(combined);
  } catch (err) {
    console.log("err: ", err);
    return res.send(err);
  }
});

module.exports = router;
